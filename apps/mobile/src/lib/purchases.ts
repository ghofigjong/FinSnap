import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { supabase } from './supabase';

export const ENTITLEMENT_PRO = 'pro';

export function initializePurchases() {
  Purchases.setLogLevel(LOG_LEVEL.WARN);
  Purchases.configure({
    apiKey: process.env.EXPO_PUBLIC_REVENUECAT_KEY!,
  });
}

export async function identifyPurchasesUser(userId: string) {
  try {
    await Purchases.logIn(userId);
  } catch (e) {
    console.warn('RevenueCat logIn failed:', e);
  }
}

export async function resetPurchasesUser() {
  try {
    await Purchases.logOut();
  } catch {
    // ignore — logOut throws if no user is logged in
  }
}

export async function checkProStatus(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return typeof info.entitlements.active[ENTITLEMENT_PRO] !== 'undefined';
  } catch {
    return false;
  }
}

export async function purchasePro(): Promise<boolean> {
  const offerings = await Purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find(
    p => p.packageType === 'MONTHLY',
  );
  if (!pkg) throw new Error('No monthly package available. Please try again later.');
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return typeof customerInfo.entitlements.active[ENTITLEMENT_PRO] !== 'undefined';
}

export async function restorePurchases(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return typeof info.entitlements.active[ENTITLEMENT_PRO] !== 'undefined';
}

export async function syncPlanToSupabase(userId: string, isPro: boolean) {
  await supabase
    .from('profiles')
    .update({ plan: isPro ? 'pro' : 'free' })
    .eq('id', userId);
}
