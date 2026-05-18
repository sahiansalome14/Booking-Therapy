import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

const getSupabaseClient = () => {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		console.warn(
			"⚠️ Warning: Supabase environment variables VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Auth-dependent features will run in offline/mock mode.",
		);
		// Safe mock client to prevent application crash
		return {
			auth: {
				onAuthStateChange: () => ({
					data: { subscription: { unsubscribe: () => {} } },
				}),
				refreshSession: async () => ({ data: { session: null }, error: null }),
				signOut: async () => {},
				getSession: async () => ({ data: { session: null }, error: null }),
			},
		} as any;
	}
	return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
};

export const supabase = getSupabaseClient();
