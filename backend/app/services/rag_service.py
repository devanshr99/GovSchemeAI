"""
RAG Service — retrieves relevant scheme context for chat and queries.
Uses SQLAlchemy full-text search and keyword matching.
"""

import logging
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models.scheme import Scheme

logger = logging.getLogger("yojana.rag")

class RAGService:

    async def get_relevant_context(self, db: AsyncSession, query: str, limit: int = 3) -> str:
        """
        Retrieves relevant schemes matching the query to build context for LLM.
        """
        try:
            # Tokenize query to search by keywords
            keywords = [k.strip() for k in query.split() if len(k.strip()) > 2]
            if not keywords:
                # Fallback to general schemes
                stmt = select(Scheme).where(Scheme.is_active == True).limit(limit)
            else:
                # Limit to top 5 most descriptive (longest) keywords to avoid bloated OR clauses
                keywords = sorted(keywords, key=len, reverse=True)[:5]
                # Build OR condition for all keywords matching name, name_hi, or description
                conditions = []
                for kw in keywords:
                    kw_pattern = f"%{kw}%"
                    conditions.append(Scheme.name.ilike(kw_pattern))
                    conditions.append(Scheme.name_hi.ilike(kw_pattern))
                    conditions.append(Scheme.description.ilike(kw_pattern))
                
                stmt = (
                    select(Scheme)
                    .where(Scheme.is_active == True)
                    .where(or_(*conditions))
                    .limit(limit)
                )

            result = await db.execute(stmt)
            schemes = result.scalars().all()

            if not schemes:
                return ""

            # Format schemes into structured text context
            context_parts = []
            for s in schemes:
                part = (
                    f"Scheme Name: {s.name}\n"
                    f"Description: {s.description}\n"
                    f"Benefits: {s.benefits or s.benefits_amount or 'N/A'}\n"
                    f"Required Documents: {', '.join(s.required_documents) if s.required_documents else 'N/A'}\n"
                    f"Application Process: {s.application_process or 'N/A'}\n"
                    f"---"
                )
                context_parts.append(part)

            return "\n\n".join(context_parts)
        except Exception as e:
            logger.error(f"Error generating RAG context: {e}")
            return ""

# Singleton
rag_service = RAGService()
