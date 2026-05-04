const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://aedkngafdsexqblzfuhv.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

function createUnavailableBuilder() {
  const error = {
    message:
      'Supabase key not configured. Set SUPABASE_SERVICE_ROLE_KEY for the backend or fallback to SUPABASE_ANON_KEY.',
  };

  const builder = {
    data: null,
    error,
    select() {
      return this;
    },
    insert() {
      return this;
    },
    update() {
      return this;
    },
    delete() {
      return this;
    },
    eq() {
      return this;
    },
    in() {
      return this;
    },
    order() {
      return this;
    },
    single() {
      return this;
    },
    maybeSingle() {
      return this;
    },
    limit() {
      return this;
    },
  };

  return builder;
}

if (!SUPABASE_KEY) {
  console.warn(
    '[supabase] Key not configured. Backend will run in degraded mode until SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY is defined.'
  );
}

const supabase = SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : {
      from() {
        return createUnavailableBuilder();
      },
    };

module.exports = supabase;
