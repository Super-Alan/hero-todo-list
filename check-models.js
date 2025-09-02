const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkModels() {
  try {
    console.log('Checking available AI models in database...\n');
    
    const models = await prisma.modelProvider.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    
    if (models.length === 0) {
      console.log('❌ No active AI models found in database!');
      console.log('\nYou need to set up at least one AI model.');
      console.log('Run the application and go to Settings > AI Configuration to add a model.\n');
      
      // Let's check if there are any inactive models
      const inactiveModels = await prisma.modelProvider.findMany({
        where: { isActive: false }
      });
      
      if (inactiveModels.length > 0) {
        console.log('Found inactive models:');
        inactiveModels.forEach(model => {
          console.log(`  - ${model.name} - ID: ${model.id}`);
        });
      }
    } else {
      console.log('✅ Found active AI models:\n');
      models.forEach(model => {
        console.log(`Model: ${model.name}`);
        console.log(`  ID: ${model.id}`);
        console.log(`  Endpoint: ${model.endpoint}`);
        console.log(`  Active: ${model.isActive ? 'Yes' : 'No'}`);
        console.log(`  Description: ${model.description || 'N/A'}`);
        console.log('');
      });
      
      // Use the first active model as default
      if (models[0]) {
        console.log(`\n🎯 First available model for WeChat parsing: ${models[0].name}`);
        console.log(`   ID: ${models[0].id}`);
        console.log('\nYou can use this ID for testing the AI parsing API directly.');
      }
    }
    
  } catch (error) {
    console.error('Error checking models:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkModels();