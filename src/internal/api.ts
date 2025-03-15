import get from "axios";

export const fetchPrice = async (ticker: string): Promise<number> => {
    const response = await get(process.env.YFINANCE_URL + '/price/' + ticker);
    if (response.status !== 200) {
        throw new Error('Failed to fetch price');
    }

    return response.data.price;
}
