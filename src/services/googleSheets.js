// src/utils/api.js

import { APPS_SCRIPT_WEB_APP_URL } from '../config';

export const sendToGoogleSheets = async (payload, logContext, onSuccess) => {
  // 1. Check if the URL is configured
  if (
    !APPS_SCRIPT_WEB_APP_URL ||
    APPS_SCRIPT_WEB_APP_URL === 'YOUR_COPIED_WEB_APP_URL_HERE'
  ) {
    console.warn(
      `Google Sheets Sync: URL not set. Skipping ${logContext} sync.`
    );
    return; // Stop execution
  }

  console.log(
    `Google Sheets Sync: Sending ${logContext} data to Apps Script:`,
    payload
  );

  // 2. Use a try...catch block to handle network errors
  try {
    const response = await fetch(APPS_SCRIPT_WEB_APP_URL, {
      method: 'POST',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json(); // Try to get the JSON body

    // 3. Check if the request was successful
    if (response.ok && data.status === 'success') {
      console.log(`Google Sheets Sync Success (${logContext}):`, data);
      // 4. If an onSuccess callback was provided, run it
      if (onSuccess) {
        onSuccess(data);
      }
    } else {
      // Handle errors reported by the script
      console.error(
        `Google Sheets Sync Error (${logContext}):`,
        data.message || data
      );
    }
  } catch (error) {
    // Handle network-level errors
    console.error(`Google Sheets Sync Network Error (${logContext}):`, error);
  }
};