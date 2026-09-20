import maplibregl from 'maplibre-gl';

export const enable3DTerrain = (map: maplibregl.Map, terrainTileUrl: string) => {
  map.addSource('raster-dem', {
    type: 'raster-dem',
    url: terrainTileUrl,
    tileSize: 512,
  });

  map.setTerrain({ source: 'raster-dem', exaggeration: 1.5 });
};