const fetch = require('node-fetch'); // Standard HTTP request or global fetch if Node 18+

exports.generateProposalSummary = async (proposalData, leadData, followUps) => {
  const apiKey = process.env.GEMINI_API_KEY;

  const followUpText = followUps.map(f => `- [${f.followUpDate}] ${f.followUpType}: ${f.notes} (Outcome: ${f.outcome})`).join('\n');
  const itemsText = proposalData.items.map(i => `- ${i.serviceName} (Qty: ${i.quantity}, Price: $${i.unitPrice}, Total: $${i.lineTotal})`).join('\n');

  const prompt = `
You are an expert sales analyst helper. Please generate a concise proposal summary and an actionable recommendation for the following sales opportunity.

Lead Details:
- Name: ${leadData.leadName}
- Company: ${leadData.companyName}
- Expected Deal Amount: $${leadData.expectedDealAmount}
- Current Status: ${leadData.status}

Proposal Details:
- Proposal Number: ${proposalData.proposalNumber}
- Subtotal: $${proposalData.subTotal}
- Discount: ${proposalData.discountPercent}%
- Grand Total: $${proposalData.grandTotal}
- Proposal Items:
${itemsText}

Follow-up History:
${followUpText}

Instructions:
Provide a structured JSON output with exactly two keys:
1. "summary": A short summary of the proposal context, customer's needs and current engagement.
2. "recommendation": A practical next step recommendation for the sales representative to close the deal.

Do not include any markdown backticks wrapper like \`\`\`json, just return the raw JSON object.
`;

  // Fallback if API key is not configured
  if (!apiKey) {
    console.log('GEMINI_API_KEY is not set. Generating a realistic simulated response.');
    return {
      summary: `Proposal ${proposalData.proposalNumber} for ${leadData.leadName} of ${leadData.companyName} consists of services totaling $${proposalData.grandTotal} after a ${proposalData.discountPercent}% discount. Follow-up notes suggest the client is highly interested.`,
      recommendation: `Follow up within 48 hours to schedule a detailed service walkthrough and confirm agreement on the proposed items.`
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Clean up potential code block wrappers from response
    const cleanText = responseText.replace(/```json/i, '').replace(/```/g, '').trim();
    
    const parsed = JSON.parse(cleanText);
    return {
      summary: parsed.summary || 'Summary could not be formatted properly.',
      recommendation: parsed.recommendation || 'Recommendation could not be formatted properly.'
    };
  } catch (error) {
    console.error('Error generating AI Summary:', error);
    // Return gracefully instead of throwing
    return {
      summary: `Failed to fetch live AI summary. Details: ${error.message}`,
      recommendation: 'Please verify GEMINI_API_KEY is set correctly in backend .env.'
    };
  }
};
