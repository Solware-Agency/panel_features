import { useQuery } from '@tanstack/react-query'

export const useExchangeRate = () => {
	return useQuery({
		queryKey: ['exchangeRate'],
		queryFn: async () => {
			const response = await fetch('https://open.er-api.com/v6/latest/USD')
			if (!response.ok) throw new Error('Network response was not ok')
			const data = await response.json()
			return data.rates.VES
		},
		staleTime: 1000 * 60 * 60, // 1 hora
	})
}
