import { useQuery } from "@tanstack/react-query"

type timePeriodicAKIData = {
  day: number,
  count: number,
}

type timePeriodicAKIStat = {
  total: number,
  precision: number,
  recall: number,
  accuracy: number
}

const data: timePeriodicAKIData[] = [
  {
    day: 1,
    count: 0,
  },
  {
    day: 2,
    count: 4,
  },
  {
    day: 3,
    count: 7,
  },
  {
    day: 4,
    count: 14,
  },
  {
    day: 5,
    count: 20,
  },
  {
    day: 6,
    count: 17,
  },
  {
    day: 7,
    count: 24,
  },
  {
    day: 8,
    count: 19,
  },
  {
    day: 9,
    count: 13,
  },
  {
    day: 10,
    count: 12,
  },
  {
    day: 11,
    count: 15,
  },
  {
    day: 12,
    count: 20,
  },
  {
    day: 13,
    count: 11,
  },
];

const mockFetchTimePeriodicAKIData = async () =>
  new Promise<timePeriodicAKIData[]>((res, _) => {
    setTimeout(() => {
      res(data) 
      // res([])
    }, 1000)
  })

export const useGetTimePeriodicAKIData = () =>
  useQuery<timePeriodicAKIData[], undefined>({
    queryKey: ["timePeriodicAKIData"],
    queryFn: mockFetchTimePeriodicAKIData,
  })

const mockAKIStat: timePeriodicAKIStat = {
  total: 17,
  precision: 0.875,
  recall: 0.432,
  accuracy: 0.95
}

const mockFetchTimePeriodicAKIStat = (startDate: Date, endDate: Date) => async () => 
  new Promise<timePeriodicAKIStat>((res, _) => {
    setTimeout(() => {
      res(mockAKIStat)
    }, 1000)
  })


export const useGetTimePeriodicAKIStat = (startDate: Date, endDate: Date) => 
  useQuery<timePeriodicAKIStat, undefined>({
    queryKey: ["timePeriodicAKIStat", { startDate, endDate }],
    queryFn: mockFetchTimePeriodicAKIStat(startDate, endDate)
  }) 
