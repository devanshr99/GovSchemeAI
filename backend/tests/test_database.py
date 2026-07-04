import pytest
from app.database import get_db, init_db, close_db
from app.models.scheme import Scheme
from app.services.scheme_service import scheme_service
from app.services.rag_service import rag_service
from sqlalchemy import select

@pytest.mark.asyncio
async def test_db_seeding_and_retrieval():
    # Make sure tables exist
    await init_db()
    
    # Run a session to verify seed data exists or seed it
    from app.utils.seed_data import seed_if_empty
    await seed_if_empty()
    
    # Retrieve using get_db dependency manually
    async for db in get_db():
        # Check states seeded
        from app.models.location import State
        states_res = await db.execute(select(State))
        states = states_res.scalars().all()
        assert len(states) > 0
        
        # Check schemes seeded
        schemes_res = await db.execute(select(Scheme))
        schemes = schemes_res.scalars().all()
        assert len(schemes) >= 50
        
        # Check SchemeService listing
        list_res = await scheme_service.list_schemes(db, page=1, page_size=5)
        assert len(list_res.schemes) == 5
        assert list_res.total >= 50
        
        # Check SchemeService category retrieval
        categories = await scheme_service.get_categories(db)
        assert len(categories) > 0
        
        # Check RAG context generation
        context = await rag_service.get_relevant_context(db, "pm-kisan")
        assert "PM-KISAN" in context
        break
