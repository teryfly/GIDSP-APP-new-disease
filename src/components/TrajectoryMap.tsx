import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import type { TrackingRecord } from '../data/trackingRecords'; // Changed to import type

// Fix for default marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});


interface TrajectoryMapProps {
    records: TrackingRecord[];
}

const TrajectoryMap = ({ records }: TrajectoryMapProps) => {
    if (records.length === 0) {
        return <div>无轨迹数据可供显示</div>;
    }

    const positions = records.map(r => [r.lat, r.lng] as [number, number]);
    const center = positions[0];

    return (
        <MapContainer center={center} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <Polyline pathOptions={{ color: 'blue' }} positions={positions} />
            {records.map(record => (
                <Marker key={record.id} position={[record.lat, record.lng]}>
                    <Popup>
                        <strong>{record.location}</strong><br />
                        {record.date} | {record.type}<br />
                        {record.description}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default TrajectoryMap;