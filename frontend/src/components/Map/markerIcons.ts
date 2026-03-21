import L from 'leaflet'

// Fix Leaflet's default icon path resolution broken by Vite's asset pipeline
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl

L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export function createCatIcon(thumbUrl: string): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 3px solid #EF3340;
        overflow: hidden;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        background: #f3f4f6;
      ">
        <img
          src="${thumbUrl}"
          style="width: 100%; height: 100%; object-fit: cover;"
          onerror="this.style.display='none'; this.parentElement.innerHTML='🐱';"
        />
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 6px solid transparent;
        border-right: 6px solid transparent;
        border-top: 8px solid #EF3340;
        margin: 0 auto;
      "></div>
    `,
    className: '',
    iconSize: [44, 52],
    iconAnchor: [22, 52],
    popupAnchor: [0, -52],
  })
}

export function createPinIcon(): L.DivIcon {
  return L.divIcon({
    html: `
      <div style="
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: #EF3340;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
      ">📍</div>
    `,
    className: '',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
  })
}
