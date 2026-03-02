// Script to kill idle PostgreSQL connections
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function killIdleConnections() {
  try {
    console.log('🔍 Checking for idle connections...');
    
    // Get all idle connections
    const idleConnections = await prisma.$queryRaw`
      SELECT pid, usename, application_name, client_addr, state, 
             state_change, query_start
      FROM pg_stat_activity 
      WHERE datname = 'ohms' 
        AND state IN ('idle', 'idle in transaction')
        AND pid <> pg_backend_pid()
      ORDER BY state_change;
    `;
    
    console.log(`Found ${idleConnections.length} idle connections`);
    
    if (idleConnections.length === 0) {
      console.log('✅ No idle connections to kill');
      return;
    }
    
    // Display idle connections
    console.log('\n📊 Idle Connections:');
    idleConnections.forEach(conn => {
      console.log(`  PID: ${conn.pid}, User: ${conn.usename}, State: ${conn.state}, Since: ${conn.state_change}`);
    });
    
    // Kill idle connections
    console.log('\n🔪 Killing idle connections...');
    const result = await prisma.$executeRaw`
      SELECT pg_terminate_backend(pid) 
      FROM pg_stat_activity 
      WHERE datname = 'ohms' 
        AND state = 'idle' 
        AND pid <> pg_backend_pid();
    `;
    
    console.log(`✅ Killed ${result} idle connections`);
    
    // Show remaining connections
    const remainingConnections = await prisma.$queryRaw`
      SELECT COUNT(*) as count
      FROM pg_stat_activity 
      WHERE datname = 'ohms';
    `;
    
    console.log(`\n📊 Remaining active connections: ${remainingConnections[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

killIdleConnections();
