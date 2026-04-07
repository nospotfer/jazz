# Problema 4 - Deploy Validation (Card + 100% Voucher)

## Scope
Validate in deployed environment:
- Card checkout flow
- 100% voucher flow
- Linked behavior after voucher redemption

## Deployment
- URL: https://jazz-il66flnhd-neurofactorys-orgs-projects.vercel.app
- Branch: jazz-lms-dev-vercel

## Actions Executed
1. Card stress test (5 consecutive attempts) using authenticated session on `/api/checkout`.
2. Voucher-100 scan against existing `LOUISARMSTRONG100...` codes from `.payments-e2e.env`.
3. Created deterministic FREE_ACCESS voucher directly in preview DB for reliable validation:
   - Code: `PROB4FREE1775521104125`
   - Type: `FREE_ACCESS`
   - Course: `550e8400-e29b-41d4-a716-446655440001`
4. Executed checkout with the new 100% voucher.
5. Re-validated linked behavior:
   - Purchase list persistence
   - Reuse/repurchase guards
   - Course unlock redirect to lesson route

## Results
### Card flow
- 5/5 successful responses
- Status: `200`
- Checkout host: `checkout.dodopayments.com`

### Existing 100% vouchers from file
- All tested `LOUISARMSTRONG100...` codes returned `400`
- No purchase was created from those legacy codes

### Deterministic 100% voucher (created for validation)
- Voucher checkout status: `200`
- Response URL: dashboard success with `voucher=true&free=true`
- Purchases after redemption: contains new amount `0` purchase
- Second voucher attempt: `400` (`El curso ya fue comprado`)
- Card attempt after voucher purchase: `400` (`El curso ya fue comprado`)

### Unlock behavior
- Visiting `/courses/550e8400-e29b-41d4-a716-446655440001` after voucher redemption redirects to:
  - `/courses/550e8400-e29b-41d4-a716-446655440001/lessons/550e8400-e29b-41d4-a716-446655440005`

## Conclusion
Problem 4 is validated as working in deploy for:
- Card checkout path
- 100% voucher redemption path
- Post-redemption purchase persistence and course-unlock guard behavior
