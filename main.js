import fetch from 'node-fetch'
import fs from 'fs'

if (process.argv[2] === undefined) {
  console.log('Input year as first argument.')
  process.exit(1)
}
let year = process.argv[2]

async function getSubjects(year) {
  const response = await fetch(`http://shanghairanking.com/api/pub/v1/gras/subj?version=${year}`)
  const data = await response.json()

  let subjects = []
  data.data.forEach(major => {
    major.detail.forEach(minor => {
      let subject = {
        fieldCode: major.code.trim(),
        field:major.nameEn.trim(),
        subjectCode: minor.code.trim(),
        subject:minor.nameEn.trim()
      }
      subjects.push(subject)
    });
  });

  return subjects
}

function getIndicators(data) {
  let indicators = {}
  for (let index = 0; index < data.length; index++) {
    const element = data[index];
    indicators[element.nameEn] = element.code
  }
  return indicators
}

async function saveARWU(year) {
  // ARWU by year
  const response = await fetch(`http://shanghairanking.com/api/pub/v1/arwu/rank?version=${year}`)
  const arwu = await response.json()
  
  let incomingIndicators = arwu.data.indicators
  let incomingRankings = arwu.data.rankings
  
  let indicators = getIndicators(incomingIndicators)
  
  let data = '"Rank", "Institution", "Country/Region", "Region Rank", "Score", "Alumni", "Award", "HiCi", "N&S", "PUB", "PCP"'
  
  for (let index = 0; index < incomingRankings.length; index++) {
    const element = incomingRankings[index];
    data += `\r\n"${element.ranking}","${element.univNameEn}","${element.region}","${element.regionRanking}","${element.score}","${element.indData[indicators['Alumni']]}","${element.indData[indicators['Award']]}","${element.indData[indicators['HiCi']]}","${element.indData[indicators['N&S']]}","${element.indData[indicators['PUB']]}","${element.indData[indicators['PCP']]}"`
  }
  fs.writeFileSync(`shangai-arwu-${year}.csv`, data)
}

async function saveGRAS(year) {
  let subjects = await getSubjects(year)

  let data = '"Field", "Subject", "Institution", "Country/Region", "Q1", "CNCI", "IC", "Top", "Award", "Score"'
  for (let index = 0; index < subjects.length; index++) {
    const sub = subjects[index];
    let url = `http://shanghairanking.com/api/pub/v1/gras/rank?version=${year}&subj_code=${sub.subjectCode}`
    const response = await fetch(url)
    const gras = await response.json()

    let incomingIndicators = gras.data.indicators
    let incomingRankings = gras.data.rankings

    let indicators = getIndicators(incomingIndicators)
  
    for (let index = 0; index < incomingRankings.length; index++) {
      const rank = incomingRankings[index];
      data += `\r\n"${sub.field}","${sub.subject}","${rank.univNameEn}", "${rank.region}", "${rank.indData[indicators['Q1']]}", "${rank.indData[indicators['CNCI']]}", "${rank.indData[indicators['IC']]}", "${rank.indData[indicators['TOP']]}", "${rank.indData[indicators['AWARD']]}", "${rank.score}"`
    }

    // rankings.forEach(item => {
    //   data += `\r\n"${element.field}","${element.subject}","${item.institution}", "${item.region}", "${item.q1}", "${item.cnci}", "${item.ic}", "${item.top}", "${item.award}", "${item.score}"`
    // })
  }
  fs.writeFileSync(`shanghai-gras-${year}.csv`, data)
}

saveARWU(year)
saveGRAS(year)
