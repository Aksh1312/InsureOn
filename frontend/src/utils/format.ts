export const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return '--'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatDate = (value?: string | null) => {
  if (!value) return '--'
  const date = new Date(value)
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
