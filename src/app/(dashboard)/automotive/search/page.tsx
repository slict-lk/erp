import { getVehicles } from '@/lib/actions/vehicle';
import { FitmentSearchManager } from '@/components/automotive/FitmentSearchManager';

export default async function FitmentSearchPage() {
    const vehicles = await getVehicles();
    return <FitmentSearchManager vehicles={vehicles} />;
}
