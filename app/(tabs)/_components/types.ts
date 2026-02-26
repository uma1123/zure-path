export type Place = {
  name: string;
  lat: number;
  lng: number;
  distance: number;
  bearing: number;
  category?: string;
};

export type ExploreResponse = {
  status: "success" | "error";
  searchedRadius: number;
  places: Place[];
  message?: string;
  detail?: string;
};
