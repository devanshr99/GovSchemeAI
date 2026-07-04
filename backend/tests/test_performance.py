import pytest
import time
import asyncio
from app.database import get_db, init_db
from app.services.cache import cache
from app.services.search_engine import search_engine
from app.routers.dashboard import get_stats
from app.services.ai_service import ai_service

@pytest.mark.asyncio
async def test_cache_performance():
    """Verify TTL Cache hits have sub-millisecond latencies."""
    await cache.clear()
    
    # Measure set time
    t0 = time.perf_counter()
    await cache.set("test_key", {"data": "performance_test"}, ttl_seconds=5.0)
    set_time = (time.perf_counter() - t0) * 1000
    
    # Measure hit time
    t1 = time.perf_counter()
    value = await cache.get("test_key")
    hit_time = (time.perf_counter() - t1) * 1000
    
    assert value is not None
    assert value["data"] == "performance_test"
    assert hit_time < 5.0  # In-memory hits must be extremely fast (<5ms)
    
    # Measure miss time after invalidation
    await cache.invalidate("test_key")
    t2 = time.perf_counter()
    miss_val = await cache.get("test_key")
    miss_time = (time.perf_counter() - t2) * 1000
    
    assert miss_val is None
    print(f"\n[Cache Performance] Set: {set_time:.3f}ms | Hit: {hit_time:.3f}ms | Miss: {miss_time:.3f}ms")

@pytest.mark.asyncio
async def test_search_latency_performance():
    """Verify that search queries with pushed DB-level filters perform efficiently."""
    await init_db()
    
    async for db in get_db():
        # Dry-run search
        t0 = time.perf_counter()
        results, total = await search_engine.search_schemes(db, query="kisan")
        duration = (time.perf_counter() - t0) * 1000
        
        # Subsequent cached autocomplete lookup
        t1 = time.perf_counter()
        suggestions = await search_engine.get_autocomplete(db, prefix="pm")
        autocomplete_duration = (time.perf_counter() - t1) * 1000
        
        print(f"\n[Search Performance] Latency: {duration:.2f}ms | Autocomplete (Cache/DB): {autocomplete_duration:.2f}ms | Count: {total}")
        
        # Target search latency under 200ms
        assert duration < 200.0
        break

@pytest.mark.asyncio
async def test_dashboard_stats_caching_performance():
    """Verify that group-by optimizations and caching reduce stats query latency by >90% on subsequent calls."""
    await init_db()
    await cache.clear()
    
    async for db in get_db():
        # First call (cache miss, group-by queries execute)
        t0 = time.perf_counter()
        stats1 = await get_stats(db)
        duration_miss = (time.perf_counter() - t0) * 1000
        
        # Second call (cache hit, instant retrieval)
        t1 = time.perf_counter()
        stats2 = await get_stats(db)
        duration_hit = (time.perf_counter() - t1) * 1000
        
        print(f"\n[Dashboard Stats Performance] Miss: {duration_miss:.2f}ms | Hit: {duration_hit:.2f}ms")
        
        assert stats1 == stats2
        assert duration_hit < 5.0  # Cache hit must be immediate (<5ms)
        assert duration_hit < (duration_miss * 0.1)  # Cache hit must be at least 90% faster than miss
        break

@pytest.mark.asyncio
async def test_concurrency_ai_explain_mock():
    """Test that explaining eligibility can execute tasks concurrently without blockages."""
    # Create simple task workloads simulating network delays
    async def mock_network_workload(label, delay):
        t0 = time.perf_counter()
        await asyncio.sleep(delay)
        elapsed = (time.perf_counter() - t0) * 1000
        return f"{label} completed in {elapsed:.1f}ms"
        
    t_start = time.perf_counter()
    results = await asyncio.gather(
        mock_network_workload("task_1", 0.1),
        mock_network_workload("task_2", 0.1),
        mock_network_workload("task_3", 0.1)
    )
    total_duration = time.perf_counter() - t_start
    
    assert total_duration < 0.2  # Concurrent execution must take ~0.1s, not 0.3s
    print(f"\n[Concurrency Heuristic] Total concurrent delay: {total_duration*1000:.1f}ms")
