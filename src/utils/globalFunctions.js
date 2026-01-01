const toDateTime = (secs) => {
  const t = new Date(+0); // Unix epoch start.
  t.setSeconds(secs);
  return t;
};

/**
 * Calculate trial end date as Unix timestamp
 * @param {number} days - Number of trial days
 * @returns {number} Unix timestamp for trial end date
 */
const calculateTrialEndUnixTimestamp = (days) => {
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + days);
  unixFormatDate = Math.floor(trialEnd.getTime() / 1000);
  console.log("🚀 ~ calculateTrialEndUnixTimestamp ~ unixFormatDate:", unixFormatDate)
  return unixFormatDate;
};

module.exports = {
  toDateTime,
  calculateTrialEndUnixTimestamp,
};  