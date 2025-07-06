function generateVipBoxLink(homeTeam, awayTeam, fixtureId = '1') {
    // Replace spaces and special characters with dashes, make lowercase
    const slugify = str =>
        str
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumeric with dash
            .replace(/^-+|-+$/g, '');    // trim leading/trailing dashes

    const homeSlug = slugify(homeTeam);
    const awaySlug = slugify(awayTeam);

    return `https://www.vipbox.lc/football/${homeSlug}-vs-${awaySlug}-${fixtureId}-live`;
}
export const generateEmailBody = (fixtureData, sportType) => {
    const {
        home_team,
        away_team,
        date_time,
        venue_details,
        league_details,
        teams_details,
        status_details
    } = fixtureData;

    const matchDate = new Date(date_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });

    const sportName = sportType.charAt(0).toUpperCase() + sportType.slice(1);

    const venue = venue_details ? `${venue_details.name}, ${venue_details.city}` : 'TBD';
    const league = league_details ? league_details.name : 'Unknown League';

    return `
    <!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${sportName} Match Notification</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f4f4f4;color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;margin:20px 0;border-radius:8px;overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#667eea,#764ba2);padding:20px;color:white;">
              <img src="${league_details?.logo || ''}" alt="${league}" width="50" style="margin-bottom:10px;">
              <h1 style="margin:0;">${sportName} Match Alert</h1>
              <p style="margin:5px 0;">Your subscribed match is here!</p>
            </td>
          </tr>

          <!-- Match Info -->
          <tr>
            <td style="padding:20px;">
              <h2 style="text-align:center;">${home_team} <span style="color:#667eea;">VS</span> ${away_team}</h2>
              <table width="100%" cellpadding="10" cellspacing="0">
                <tr>
                  <td align="center">
                    ${teams_details?.home?.logo ? `<img src="${teams_details.home.logo}" alt="${home_team}" width="60" style="display:block;margin:auto;">` : ''}
                    <strong>${home_team}</strong>
                  </td>
                  <td align="center">
                    ${teams_details?.away?.logo ? `<img src="${teams_details.away.logo}" alt="${away_team}" width="60" style="display:block;margin:auto;">` : ''}
                    <strong>${away_team}</strong>
                  </td>
                </tr>
              </table>

              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;">

              <!-- Details -->
              <p><strong>Date & Time:</strong> ${matchDate}</p>
              <p><strong>League:</strong> ${league}</p>
              <p><strong>Venue:</strong> ${venue}</p>
              ${fixtureData.referee ? `<p><strong>Referee:</strong> ${fixtureData.referee}</p>` : ''}
              <p><strong>Status:</strong> ${status_details ? status_details.long : 'TBD'}</p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:20px;">
              <a href="${generateVipBoxLink(fixtureData.home_team, fixtureData.away_team)}" style="display:inline-block;background-color:#667eea;color:#fff;padding:12px 20px;border-radius:4px;text-decoration:none;">View Full Match on VipBox</a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px;color:#999;font-size:12px;">
              <p>You’re receiving this email because you subscribed to ${sportName} match notifications.</p>
              <p><a href="" style="color:#667eea;text-decoration:none;">Unsubscribe</a> if you no longer wish to receive these updates.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}


export const generateEmailSubject = (fixtureData, sportType) => {
    const { home_team, away_team, date_time, league_details } = fixtureData;
    const matchDate = new Date(date_time).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    switch (sportType) {
        case 'soccer':
            return `${home_team} vs ${away_team} - ${matchDate}`;
        case 'basketball':
            return `${home_team} vs ${away_team} - ${matchDate}`;
        case 'tennis':
            return `${home_team} vs ${away_team} - ${matchDate}`;
        default:
            return `${home_team} vs ${away_team} - ${matchDate}`;
    }
}