import mongoose from 'mongoose';
import env from '../config/env.js';
import Document from '../models/Document.js';
import LandRecord from '../models/LandRecord.js';
import pipelineService from '../services/pipelineService.js';

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const doc = await Document.findOne({ originalFilename: /DOC-20260925-63D5738F/i }) || await Document.findOne({ _id: '6ab676f002f376552908545f' });
  if (!doc) {
    console.error('Target document not found in DB');
    const allDocs = await Document.find({}).select('originalFilename _id status');
    console.log('Available docs:', allDocs);
    process.exit(1);
  }

  console.log(`Reprocessing document: ${doc._id} (${doc.originalFilename})...`);
  await pipelineService.runPipeline(doc._id);

  console.log('Pipeline execution finished. Fetching LandRecord...');
  const record = await LandRecord.findOne({ documentId: doc._id });
  if (!record) {
    console.error('LandRecord not found after processing!');
    process.exit(1);
  }

  console.log('\n=== REPROCESSED LAND RECORD ===');
  console.log('Owner(s):', JSON.stringify(record.owner, null, 2));
  console.log('Land Info:', JSON.stringify(record.landInformation, null, 2));
  console.log('Location:', JSON.stringify(record.location, null, 2));
  console.log('Mutation:', JSON.stringify(record.mutation, null, 2));
  console.log('Registration:', JSON.stringify(record.registration, null, 2));
  console.log(`Landholders count: ${record.landholders?.length}`);
  console.log('Landholders:', JSON.stringify(record.landholders, null, 2));
  console.log(`Land Parcels count: ${record.landParcels?.length}`);
  console.log('Land Parcels:', JSON.stringify(record.landParcels, null, 2));
  console.log(`Mutations count: ${record.mutations?.length}`);
  console.log('Mutations:', JSON.stringify(record.mutations, null, 2));
  console.log(`Registrations count: ${record.registrations?.length}`);
  console.log('Registrations:', JSON.stringify(record.registrations, null, 2));
  console.log('Verification Status:', record.verificationStatus);
  console.log('Overall Confidence:', record.overallConfidence);

  process.exit(0);
}

main().catch(err => {
  console.error('Error reprocessing:', err);
  process.exit(1);
});
