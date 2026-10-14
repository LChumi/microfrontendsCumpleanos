export interface Punto {
  lat: number;
  lng: number;
  accuracy: number;
  timestamp: string; // ISO
}

export interface UltimaUbicacion {
  username: string;
  location: { coordinates: [number, number] }; // [lng, lat]
  timestamp: string;
}

export interface LocationPointDto {
  usrId: string;
  location: { coordinates: [number, number] };
  accuracy: number;
  timestamp: string;
}

export interface Posicion {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface BatchRequest {
  username: string;
  puntos: Punto[];
}
