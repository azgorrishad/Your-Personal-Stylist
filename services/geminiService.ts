import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StyleSuggestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const fileToGenerativePart = (dataUrl: string) => {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/png';
  return {
    inlineData: {
      data,
      mimeType
    },
  };
};

export const generateStyleSuggestions = async (
  closeupImage: string,
  fullBodyImage: string,
  occasion: string,
  styleCategory: string
): Promise<StyleSuggestion> => {
  const model = "gemini-2.5-flash";

  const prompt = `
    You are a world-class AI personal stylist. Your task is to analyze two photos of a person (a closeup and a full body shot) to determine their face and body shape, and then create a complete, personalized style recommendation.

    **CONTEXT:**
    - **Occasion:** ${occasion || 'Not specified'}
    - **Preferred Style:** ${styleCategory === 'Let AI Decide' ? 'You have complete creative freedom.' : styleCategory}

    **ANALYSIS:**
    1.  **Analyze Face Shape:** From the closeup photo, identify the person's face shape (e.g., Oval, Round, Square, Heart, Diamond).
    2.  **Analyze Body Shape:** From the full body photo, identify the person's body shape (e.g., Hourglass, Pear, Apple, Rectangle, Inverted Triangle).
    
    **RECOMMENDATIONS:**
    Based on your analysis and the provided context, create a full outfit recommendation covering the following categories. Be specific and fashionable.
    - **Outfit:** Describe a complete outfit.
    - **Sunglasses:** Recommend a style that complements the identified face shape.
    - **Accessories:** Suggest items like a watch, necklace, bracelet, or bag.
    - **Shoes:** Recommend footwear that completes the look.
    
    **REASONING:**
    Provide an "overallReasoning" explaining why this combination of items creates a cohesive and flattering look for this specific person, considering their features, the occasion, and the style preference.

    **CRITICAL OUTPUT FORMATTING RULES:**
    - You MUST output a single, raw, valid JSON object.
    - Do NOT wrap the JSON in markdown backticks (\`\`\`json ... \`\`\`).
    - Do NOT add any text before or after the JSON object.
    - The JSON object must strictly adhere to the provided schema.
  `;
  
  const suggestionItemSchema = {
      type: Type.OBJECT,
      properties: {
          item: { type: Type.STRING, description: "The name of the suggested item (e.g., 'Classic Aviator Sunglasses')." },
          description: { type: Type.STRING, description: "A brief reason why this item is a good choice for the user." },
      },
      required: ['item', 'description']
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      faceShape: { type: Type.STRING, description: "The identified face shape of the person." },
      bodyShape: { type: Type.STRING, description: "The identified body shape of the person." },
      outfit: suggestionItemSchema,
      sunglasses: suggestionItemSchema,
      accessories: suggestionItemSchema,
      shoes: suggestionItemSchema,
      overallReasoning: { type: Type.STRING, description: "A summary explaining the styling choices." },
    },
    required: ['faceShape', 'bodyShape', 'outfit', 'sunglasses', 'accessories', 'shoes', 'overallReasoning']
  };

  const result = await ai.models.generateContent({
    model: model,
    contents: {
        parts: [
            { text: prompt },
            { text: "Closeup Photo:" },
            fileToGenerativePart(closeupImage),
            { text: "Full Body Photo:" },
            fileToGenerativePart(fullBodyImage),
        ]
    },
    config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
    }
  });
  
  const responseText = result.text;
  
  try {
    return JSON.parse(responseText) as StyleSuggestion;
  } catch (error) {
    console.error("Error parsing JSON response:", error, "Response text:", responseText);
    throw new Error("Failed to get style suggestions. The AI's response was not valid JSON.");
  }
};

export const generateStyledImage = async (
  closeupImage: string,
  fullBodyImage: string,
  suggestions: StyleSuggestion,
  occasion: string,
  styleCategory: string
): Promise<string> => {
    const model = 'gemini-2.5-flash-image';

    const prompt = `
      **ABSOLUTE HIGHEST PRIORITY: 100% FACE REPLICATION**
      - The single most important instruction is to replicate the person's face from the "CLOSEUP PHOTO" with 100% accuracy.
      - The generated face **MUST be a perfect, photorealistic, and exact copy** of the user's face.
      - **DO NOT ALTER** any facial features, skin tone, hair style, or expression. The likeness must be preserved perfectly. This is not optional.

      **GOAL:** Generate a photorealistic, high-resolution, full-body image of the person from the photos, styled in the recommended outfit.

      **OTHER CRITICAL INSTRUCTIONS (MUST BE FOLLOWED):**

      1.  **BODY SHAPE MATCH:**
          - The body shape in the generated image **MUST** match the body shape in the "FULL BODY PHOTO".

      2.  **STYLED OUTFIT:**
          - Dress the person in the following outfit. Adhere to the descriptions precisely.
              - **Outfit:** ${suggestions.outfit.item} - ${suggestions.outfit.description}
              - **Sunglasses:** ${suggestions.sunglasses.item} - ${suggestions.sunglasses.description}
              - **Accessories:** ${suggestions.accessories.item} - ${suggestions.accessories.description}
              - **Shoes:** ${suggestions.shoes.item} - ${suggestions.shoes.description}
      
      3.  **BACKGROUND & AESTHETIC:**
          - The background should be a stylish and appropriate setting for the occasion: **"${occasion || 'A fashionable, neutral setting'}"**.
          - The overall image style should be: **"${styleCategory === 'Let AI Decide' ? 'Modern and fashionable' : styleCategory}"**.
          - The final image should look like a professional fashion lookbook photo.

      4.  **IMAGE FORMAT:**
          - Generate the image with a **9:16 aspect ratio** (portrait mode), suitable for social media stories.
          - Output at the highest possible resolution.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { text: prompt },
                { text: "REFERENCE CLOSEUP PHOTO (FOR FACE):" },
                fileToGenerativePart(closeupImage),
                { text: "REFERENCE FULL BODY PHOTO (FOR BODY):" },
                fileToGenerativePart(fullBodyImage),
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });
    
    const part = response.candidates?.[0]?.content?.parts[0];
    if (part?.inlineData?.data && part.inlineData.mimeType) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }

    throw new Error("Image generation failed. The AI did not return an image.");
};

export const refineStyledImage = async (
  baseImage: string,
  refinePrompt: string,
  closeupImage: string,
): Promise<string> => {
    const model = 'gemini-2.5-flash-image';

    const prompt = `
      **ABSOLUTE HIGHEST PRIORITY: 100% FACE PRESERVATION**
      - The single most important instruction is to preserve the person's face from the "REFERENCE CLOSEUP PHOTO" with 100% accuracy.
      - The face in the final edited image **MUST remain a perfect, photorealistic, and exact copy** of the face in the closeup photo.
      - **DO NOT ALTER** any facial features, skin tone, hair style, or expression. The likeness must be preserved perfectly. This is not optional.

      **GOAL:** Edit the provided "BASE IMAGE" according to the user's instructions while strictly preserving the person's face.

      **OTHER CRITICAL INSTRUCTIONS (MUST BE FOLLOWED):**

      1.  **APPLY USER'S EDIT:**
          - Read the "EDIT INSTRUCTION" carefully.
          - Apply the following change to the "BASE IMAGE": **"${refinePrompt}"**
          - Only apply the requested change. Do not alter other parts of the outfit or background unless instructed to.

      2.  **MAINTAIN QUALITY & COMPOSITION:**
          - The output image should be a high-resolution, photorealistic photo.
          - Maintain the original image's composition, lighting, and 9:16 aspect ratio.
    `;

    const response = await ai.models.generateContent({
        model,
        contents: {
            parts: [
                { text: prompt },
                { text: "EDIT INSTRUCTION:" },
                { text: refinePrompt },
                { text: "BASE IMAGE (TO BE EDITED):" },
                fileToGenerativePart(baseImage),
                { text: "REFERENCE CLOSEUP PHOTO (FOR FACE):" },
                fileToGenerativePart(closeupImage),
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    const part = response.candidates?.[0]?.content?.parts[0];
    if (part?.inlineData?.data && part.inlineData.mimeType) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }

    throw new Error("Image refinement failed. The AI did not return an image.");
};