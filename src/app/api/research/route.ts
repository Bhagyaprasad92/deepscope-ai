import { NextResponse } from 'next/server';
import { researchService } from '@/lib/agents/ResearchService';

// Force dynamic so Next.js doesn't cache the API route build
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendUpdate = (data: any) => {
          controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'));
        };

        try {
          const report = await researchService.processQuery(query, (status) => {
            sendUpdate({ status });
          });
          
          sendUpdate({ status: 'Complete', report });
          controller.close();
        } catch (error: any) {
          console.error("Research Error:", error);
          sendUpdate({ error: 'Failed to complete research pipeline.', details: error.message });
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
