import { 
    HistoricalUsage, 
    PrepCalculation, 
    DailyRequirement 
} from '@/types/prep';

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function calculateDailyPrep(
    historicalData: HistoricalUsage[],
    currentDate: Date,
    bufferPercentage: number
): PrepCalculation[] {
    // Ensure dates are Date objects
    const processedData = historicalData.map(entry => ({
        ...entry,
        date: entry.date instanceof Date ? entry.date : new Date(entry.date)
    }));

    const itemGroups = processedData.reduce((groups, entry) => {
        if (!groups[entry.prepItemId]) {
            groups[entry.prepItemId] = {
                itemId: entry.prepItemId,
                name: entry.name,
                unit: entry.unit,
                usage: []
            };
        }
        groups[entry.prepItemId].usage.push(entry);
        return groups;
    }, {} as Record<number, { 
        itemId: number; 
        name: string; 
        unit: string; 
        usage: HistoricalUsage[] 
    }>);

    return Object.values(itemGroups).map(group => {
        const dailyRequirements: DailyRequirement[] = DAYS.map((day, index) => {
            const dayUsage = group.usage.filter(entry => {
                try {
                    const entryDate = entry.date instanceof Date ? entry.date : new Date(entry.date);
                    return entryDate.getDay() === index;
                } catch {
                    console.error('Invalid date in historical data:', entry.date);
                    return false;
                }
            });

            const avgQuantity = dayUsage.length > 0
                ? dayUsage.reduce((sum, entry) => sum + entry.quantity, 0) / dayUsage.length
                : 0;

            const maxUsage = Math.max(...group.usage.map(entry => entry.quantity), 0);
            const percentage = maxUsage > 0 ? (avgQuantity / maxUsage) * 100 : 0;

            return {
                day,
                quantity: avgQuantity,
                percentage: Math.round(percentage)
            };
        });

        const currentDayIndex = currentDate.getDay();
        const nextDayIndex = (currentDayIndex + 1) % 7;

        const currentDayReq = dailyRequirements[currentDayIndex].quantity;
        const nextDayReq = dailyRequirements[nextDayIndex].quantity * 0.5;

        return {
            itemId: group.itemId,
            name: group.name,
            unit: group.unit,
            dailyRequirements,
            totalRequired: Math.ceil(currentDayReq + nextDayReq),
            bufferPercentage
        };
    });
}