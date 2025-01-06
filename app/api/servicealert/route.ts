import { NextRequest, NextResponse } from 'next/server';

interface Translation {
  language: string;
  text: string;
}

interface AlertEntity {
  alert: {
    informed_entity: Array<{ route_id: string }>;
    header_text?: {
      translation: Translation[];
    };
    description_text?: {
      translation: Translation[];
    };
    transit_realtime?: {
      mercury_alert: {
        created_at: number;
        updated_at: number;
        alert_type: string;
        human_readable_active_period: {
          translation: Translation[];
        };
      };
    };
    active_period?: Array<{
      start?: number;
      end?: number;
    }>;
  };
}

type Alert = {
  route: string;
  summary: string;
  description: string;
  creationTime: string;
  updatedTime: string;
  activePeriod: Array<{
    start: string;
    end: string;
  }>;
  status: string;
  notice: string;
  mapLink: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('routeId');
    const agencyId = 'MTA NYCT';

    if (!routeId) {
      return NextResponse.json({ error: 'Missing routeId parameter' }, { status: 400 });
    }    
    
    const formattedRouteId = routeId.replace('MTA NYCT_', '').toUpperCase();

    const apiUrl = `https://collector-otp-prod.camsys-apps.com/realtime/gtfsrt/filtered/alerts?type=json&apikey=${process.env.MTA_API_KEY}&routeId=${encodeURIComponent(formattedRouteId)}&agencyId=${encodeURIComponent(agencyId)}&startDate=2024-01-01T00:00:00&endDate=2025-12-31T23:59:59`;

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts from MTA API: ${response.status}`);
    }

    const data = await response.json() as { entity?: AlertEntity[] };
    
    const alertsList: Alert[] = data?.entity?.filter((entity: AlertEntity) => {
      return entity?.alert?.informed_entity?.some(e => e.route_id === formattedRouteId);
    }).map((entity: AlertEntity) => {
      const alert = entity.alert;
      
      return {
        route: routeId,
        summary: alert?.header_text?.translation?.find(t => t.language === 'en')?.text || 'No summary available',
        description: alert?.description_text?.translation?.find(t => t.language === 'en')?.text || 'No description available',
        creationTime: alert?.transit_realtime?.mercury_alert?.created_at
          ? new Date(alert.transit_realtime.mercury_alert.created_at * 1000).toISOString()
          : 'Unknown',
        updatedTime: alert?.transit_realtime?.mercury_alert?.updated_at
          ? new Date(alert.transit_realtime.mercury_alert.updated_at * 1000).toISOString()
          : 'Unknown',
        activePeriod: alert?.active_period?.map(period => ({
          start: period.start ? new Date(period.start * 1000).toISOString() : 'Unknown',
          end: period.end ? new Date(period.end * 1000).toISOString() : 'Unknown'
        })) || [],
        status: alert?.transit_realtime?.mercury_alert?.alert_type || 'Unknown',
        notice: alert?.transit_realtime?.mercury_alert?.human_readable_active_period?.translation?.find(t => t.language === 'en')?.text || 'No notice provided',
        mapLink: alert?.description_text?.translation?.find(t => t.language === 'en-html')?.text?.match(/href="(https:\/\/[^\s"]+)"/)?.[1] || ''
      };
    }) || [];

    if (!alertsList.length) {
      return NextResponse.json({ situations: [], message: 'No alerts found for this route.' }, { status: 200 });
    }

    return NextResponse.json({ situations: alertsList }, { status: 200 });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('🚨 Error fetching MTA Alerts:', errorMessage);
    return NextResponse.json({ error: 'Failed to fetch alerts from MTA backend API' }, { status: 500 });
  }
}