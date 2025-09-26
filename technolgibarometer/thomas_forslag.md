



```mermaid
flowchart LR
  subgraph Sources
    P1[Portal e-post\n(Emagine/Verama/...)]
    P2[Direkte kunde-epost]
    P3[Manuell opplasting]
  end

  P1 & P2 & P3 --> GI[Gmail Intake\n(label + Pub/Sub)]
  GI --> BZ[Bronze:\nRaw email + metadata]

  subgraph Transform
    EX[Extractor (LLM/RAG)\n→ must/bør/role/tech]
    EM[Embedder\n(OpenAI/Gemini/Azure/Ollama)]
  end

  BZ --> EX --> SV[Silver:\nOpportunity JSONB]
  SV --> EM --> SV

  subgraph CandidateMatch
    FC[Flowcase Sync\n(Consultant/Skills/CV)]
    PG[(PostgreSQL + pgvector)]
    MT[Match Service]
  end

  SV --> MT
  FC --> PG
  MT --> PG
  EM --> PG

  subgraph Gold
    AGG[Aggregations\nTechDemand/RoleDemand/SkillGaps]
  end

  SV --> AGG
  PG --> AGG

  subgraph Presentation
    UI[Barometer UI (React)\nTop tech/roller + trender]
    CMUI[Candidate-match UI\nKandidater/score]
    BI[BI (Superset/Power BI)]
    SL[Slack/Teams varsler]
  end

  AGG --> UI & BI
  SV --> CMUI
  MT --> SL
```