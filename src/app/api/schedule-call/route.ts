import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, phone, preferredTime, analysisUrl, businessGoals } = await request.json()

    if (!name || !email || !preferredTime) {
      return NextResponse.json(
        { error: 'Name, email, and preferred time are required' },
        { status: 400 }
      )
    }

    // Generate meeting link and calendar event
    const meetingId = `meet_${Date.now()}`
    const calendarLink = generateCalendarLink({
      title: `InfinityStack Strategy Call - ${company || name}`,
      description: `Strategy consultation based on analysis of ${analysisUrl}. Goals: ${businessGoals}`,
      startTime: new Date(preferredTime),
      duration: 60
    })

    // In production, integrate with calendar service (Calendly, Google Calendar, etc.)
    
    return NextResponse.json({
      success: true,
      meetingId,
      calendarLink,
      confirmationEmail: email,
      meetingDetails: {
        duration: '60 minutes',
        type: 'Video Call',
        agenda: [
          'Review website analysis results',
          'Discuss business optimization opportunities',
          'Custom dashboard walkthrough',
          'Implementation strategy',
          'Q&A session'
        ]
      }
    })
  } catch (error) {
    console.error('Schedule call error:', error)
    return NextResponse.json(
      { error: 'Failed to schedule call' },
      { status: 500 }
    )
  }
}

function generateCalendarLink({ title, description, startTime, duration }: any) {
  const endTime = new Date(startTime.getTime() + duration * 60000)
  const formatDate = (date: Date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startTime)}/${formatDate(endTime)}`,
    details: description,
    location: 'Video Call (Link will be provided)'
  })
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}