const fetch = require('node-fetch');

const url = 'https://gmljypddryfgnlhpufht.supabase.co/functions/v1/backfill-user-data';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const invokeFunction = async (user) => {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceRoleKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user })
    });

    const data = await response.json();
    console.log(data);
  } catch (error) {
    console.error('Error invoking function:', error);
  }
};

(async () => {
  await invokeFunction('samcr');
})();
