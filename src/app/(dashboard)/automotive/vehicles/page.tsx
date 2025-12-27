import { getVehicles } from '@/lib/actions/vehicle';
import { VehicleManager } from '@/components/automotive/VehicleManager';

export default async function VehicleDatabasePage() {
    const vehicles = await getVehicles();

    return <VehicleManager initialVehicles={vehicles} />;
}
