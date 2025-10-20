
export interface SuggestionItem {
  item: string;
  description: string;
}

export interface StyleSuggestion {
  faceShape: string;
  bodyShape: string;
  outfit: SuggestionItem;
  sunglasses: SuggestionItem;
  accessories: SuggestionItem;
  shoes: SuggestionItem;
  overallReasoning: string;
}
   