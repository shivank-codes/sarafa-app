export function balance({ bills = [], payments = [] }) {
  const owed = bills
    .filter((b) => b.settlement === 'udhaar')
    .reduce((s, b) => s + b.totalPaise, 0);
  const paid = payments.reduce((s, p) => s + p.amountPaise, 0);
  return owed - paid;
}

export function outstanding(customers, billsByCustomer, paymentsByCustomer) {
  return customers
    .map((customer) => ({
      customer,
      balancePaise: balance({
        bills: billsByCustomer[customer.id] || [],
        payments: paymentsByCustomer[customer.id] || []
      })
    }))
    .filter((r) => r.balancePaise !== 0)
    .sort((a, b) => b.balancePaise - a.balancePaise);
}
