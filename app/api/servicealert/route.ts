import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let routeId = searchParams.get('routeId');

    if (!routeId) {
      return NextResponse.json({ error: 'Missing routeId parameter' }, { status: 400 });
    }

    // Force MTA NYCT for routes
    let agencyId = 'MTA NYCT';

    // Remove agency prefix if present and ensure proper formatting
    let formattedRouteId = routeId.replace('MTA NYCT_', '').toUpperCase();

    // Build API URL
    const apiUrl = `https://collector-otp-prod.camsys-apps.com/realtime/gtfsrt/filtered/alerts?type=json&apikey=${process.env.MTA_API_KEY}&routeId=${encodeURIComponent(formattedRouteId)}&agencyId=${encodeURIComponent(agencyId)}&startDate=2024-01-01T00:00:00&endDate=2025-12-31T23:59:59`;

    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch alerts from MTA API: ${response.status}`);
    }

    const data = await response.json();

    const alerts = data?.entity?.filter((entity: any) => {
      return entity?.alert?.informed_entity?.some((e: any) => e.route_id === formattedRouteId);
    }).map((entity: any) => {
      const alert = entity.alert;

      return {
            route: routeId,
            summary: alert?.header_text?.translation?.find((t: any) => t.language === 'en')?.text || 'No summary available',
            description: alert?.description_text?.translation?.find((t: any) => t.language === 'en')?.text || 'No description available',
            creationTime: alert?.transit_realtime?.mercury_alert?.created_at
              ? new Date(alert.transit_realtime.mercury_alert.created_at * 1000).toISOString()
              : 'Unknown',
            updatedTime: alert?.transit_realtime?.mercury_alert?.updated_at
              ? new Date(alert.transit_realtime.mercury_alert.updated_at * 1000).toISOString()
              : 'Unknown',
            activePeriod: alert?.active_period?.map((period: any) => ({
              start: period.start ? new Date(period.start * 1000).toISOString() : 'Unknown',
              end: period.end ? new Date(period.end * 1000).toISOString() : 'Unknown'
            })) || [],
            status: alert?.transit_realtime?.mercury_alert?.alert_type || 'Unknown',
            notice: alert?.transit_realtime?.mercury_alert?.human_readable_active_period?.translation?.find((t: any) => t.language === 'en')?.text || 'No notice provided',
            mapLink: alert?.description_text?.translation?.find((t: any) => t.language === 'en-html')?.text?.match(/href="(https:\/\/[^\s"]+)"/)?.[1] || ''
          };
    }) || [];

    if (!alerts.length) {
      return NextResponse.json({ situations: [], message: 'No alerts found for this route.' }, { status: 200 });
    }

    return NextResponse.json({ situations: alerts }, { status: 200 });
  } catch (error: any) {
    console.error('🚨 Error fetching MTA Alerts:', error.message || error);
    return NextResponse.json({ error: 'Failed to fetch alerts from MTA backend API' }, { status: 500 });
  }
}