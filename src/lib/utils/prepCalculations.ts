export interface DailyPrepRequirement {
    quantity: number;
    day: string;
    percentage: number;
}

export interface PrepCalculation {
    itemId: number;
    name: string;
    unit: string;
    dailyRequirements: DailyPrepRequirement[];
    totalRequired: number;
    bufferPercentage: number;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function calculateDailyPrep(
    historicalSales: any[],
    currentDate: Date,
    bufferPercentage: number = 50
): PrepCalculation[] {
    const calculations = new Map<number, PrepCalculation>();

    // Group sales by day of week
    historicalSales.forEach(sale => {
        const saleDate = new Date(sale.date);
        const dayName = DAYS[saleDate.getDay()];

        if (!calculations.has(sale.prepItemId)) {
            calculations.set(sale.prepItemId, {
                itemId: sale.prepItemId,
                name: sale.itemName,
                unit: sale.unit,
                dailyRequirements: DAYS.map(day => ({
                    day,
                    quantity: 0,
                    percentage: day === DAYS[currentDate.getDay()] ? 100 :
                        day === DAYS[(currentDate.getDay() + 1) % 7] ? bufferPercentage : 0
                })),
                totalRequired: 0,
                bufferPercentage
            });
        }

        const calc = calculations.get(sale.prepItemId)!;
        const dayReq = calc.dailyRequirements.find(d => d.day === dayName)!;
        dayReq.quantity += sale.quantity * sale.prepQuantity;
    });

    // Calculate totals with buffer
    return Array.from(calculations.values()).map(calc => {
        calc.totalRequired = calc.dailyRequirements.reduce((total, day) =>
            total + (day.quantity * (day.percentage / 100)), 0);
        return calc;
    });
}

export function formatPrepSheet(calculations: PrepCalculation[]): string {
    return calculations
        .map(calc => {
            const dayBreakdown = calc.dailyRequirements
                .map(day => `${day.day}: ${day.quantity.toFixed(2)} ${calc.unit} (${day.percentage}%)`)
                .join('\n');

            return `
  ${calc.name}
  ${'-'.repeat(calc.name.length)}
  ${dayBreakdown}
  Total Required: ${calc.totalRequired.toFixed(2)} ${calc.unit}
  `;
        })
        .join('\n\n');
}