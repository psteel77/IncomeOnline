import asyncio
import json
import os
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime

async def export_data():
    mongo_url = os.environ.get('MONGO_URL')
    db_name = os.environ.get('DB_NAME', 'earnonline')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    # Get all collections
    collections = await db.list_collection_names()
    print(f"Found collections: {collections}")
    
    export_dir = '/app/export_backup/mongodb_data'
    os.makedirs(export_dir, exist_ok=True)
    
    for collection_name in collections:
        collection = db[collection_name]
        documents = await collection.find({}).to_list(length=None)
        
        # Convert ObjectId and datetime to strings
        for doc in documents:
            if '_id' in doc:
                doc['_id'] = str(doc['_id'])
            for key, value in doc.items():
                if isinstance(value, datetime):
                    doc[key] = value.isoformat()
        
        filepath = f'{export_dir}/{collection_name}.json'
        with open(filepath, 'w') as f:
            json.dump(documents, f, indent=2, default=str)
        print(f"Exported {len(documents)} documents from '{collection_name}' to {filepath}")
    
    client.close()
    print("\nExport complete!")

asyncio.run(export_data())
