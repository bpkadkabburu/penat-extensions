import dotenv from 'dotenv'
import { setTimeout } from 'timers/promises'
import fs from 'fs/promises'
import path from 'path'

// Load environment variables
dotenv.config()

// Get the authorization token from environment variables
const authToken = process.env.AUTH_TOKEN

if (!authToken) {
  console.error('Error: AUTH_TOKEN environment variable is not set')
  process.exit(1)
}

// Function to get current date in YYYY-MM-DD format
function getCurrentDate () {
  const today = new Date()
  return today.toISOString().split('T')[0]
}

// Create a rate limiter to track remaining requests
class RateLimiter {
  constructor () {
    this.limit = 20 // Default limit
    this.remaining = 20 // Default remaining
    this.resetSeconds = 0 // Time until reset
    this.lastUpdated = Date.now()
  }

  // Update rate limit info from response headers
  updateFromHeaders (headers) {
    this.limit = parseInt(headers.get('x-ratelimit-limit') || this.limit)
    this.remaining = parseInt(headers.get('x-ratelimit-remaining') || this.remaining)
    this.resetSeconds = parseInt(headers.get('x-ratelimit-reset') || 0)
    this.lastUpdated = Date.now()

    console.log(`Rate limit: ${this.remaining}/${this.limit}, resets in ${this.resetSeconds}s`)
  }

  // Check if we should wait before making another request
  async shouldWait () {
    // If we have requests remaining, no need to wait
    if (this.remaining > 0) return false

    // Calculate how long we need to wait
    const elapsedSinceUpdate = (Date.now() - this.lastUpdated) / 1000
    const remainingWaitTime = Math.max(0, this.resetSeconds - elapsedSinceUpdate)

    if (remainingWaitTime > 0) {
      console.log(`Rate limit exceeded. Waiting ${remainingWaitTime.toFixed(1)} seconds...`)
      await setTimeout(remainingWaitTime * 1000 + 5000) // Add 1 second buffer
      return true
    }

    return false
  }
}

// Create a client for making requests
class SIPDClient {
  constructor () {
    this.rateLimiter = new RateLimiter()
    this.baseUrl = 'https://service.sipd.kemendagri.go.id'
    this.currentDate = getCurrentDate()
    this.flattenedResults = [] // Store flattened results here
    this.counter = 0 // Counter for numbering records
    this.outputDir = path.join('JSON', '2025-1') // Output directory
  }

  // Function to make the actual request with retries
  async makeRequest (endpoint, retries = 3) {
    // Check if we need to wait due to rate limiting
    await this.rateLimiter.shouldWait()

    try {
      const url = `${this.baseUrl}${endpoint}?tanggal_akhir=${this.currentDate}`

      console.log(`Making request to: ${url}`)

      // Create headers exactly like in Postman
      const headers = new Headers()
      headers.append('Origin', 'https://sipd.kemendagri.go.id')
      headers.append('Authorization', `Bearer ${authToken}`)
      headers.append('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

      const requestOptions = {
        method: 'GET',
        headers,
        redirect: 'follow',
      }

      // Use native fetch API
      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // Update rate limiter with headers from response
      this.rateLimiter.updateFromHeaders(response.headers)

      // Parse and return the JSON response
      const data = await response.json()
      return data
    } catch (error) {
      // Handle rate limit errors specifically
      if (error.message.includes('429')) {
        console.log('Rate limit exceeded according to response status')

        // Wait for rate limit reset if retries remain
        if (retries > 0) {
          await this.rateLimiter.shouldWait()
          return this.makeRequest(endpoint, retries - 1)
        }
      }

      // Handle other errors
      console.error(`Request failed for ${endpoint}:`, error.message)
      if (retries > 0) {
        console.log(`Retrying... (${retries} attempts left)`)
        await setTimeout(2000) // Wait 2 seconds before retry
        return this.makeRequest(endpoint, retries - 1)
      } else {
        throw new Error(`Failed to fetch data from ${endpoint} after all retries: ${error.message}`)
      }
    }
  }

  // Create output directory if it doesn't exist
  async ensureOutputDirExists () {
    try {
      await fs.mkdir(this.outputDir, { recursive: true })
      console.log(`Created output directory: ${this.outputDir}`)
    } catch (error) {
      console.error(`Error creating output directory: ${error.message}`)
      throw error
    }
  }

  // Process all data recursively and flatten the structure
  async processAllData (maxSKPD = Infinity) {
    try {
      // Ensure output directory exists
      await this.ensureOutputDirExists()

      // Step 1: Fetch SKPD list
      const skpdList = await this.makeRequest('/pengeluaran/strict/dashboard/statistik-belanja')
      console.log(`Found ${skpdList.length} SKPDs`)

      // Limit the number of SKPDs to process if needed
      const limitedSKPDList = skpdList.slice(0, maxSKPD)

      // Step 2: Process each SKPD
      for (const [index, skpd] of limitedSKPDList.entries()) {
        console.log(`Processing SKPD ${index + 1}/${limitedSKPDList.length}: ${skpd.nama_skpd} (ID: ${skpd.id_skpd})`)
        // if( skpd.id_skpd !== 413 ) continue;
        try {
          // Step 3: Fetch sub-SKPD for this SKPD
          const subSKPDList = await this.makeRequest(`/pengeluaran/strict/dashboard/statistik-belanja/${skpd.id_skpd}`)
          console.log(`Found ${subSKPDList.length} sub-SKPDs for SKPD ${skpd.id_skpd}`)

          // Step 4: Process each sub-SKPD
          for (const subSKPD of subSKPDList) {
            console.log(`Processing sub-SKPD: ${subSKPD.nama_sub_skpd} (ID: ${subSKPD.id_sub_skpd})`)

            try {
              // Step 5: Fetch bidang urusan for this SKPD and sub-SKPD
              const bidangUrusanList = await this.makeRequest(`/pengeluaran/strict/dashboard/statistik-belanja/${skpd.id_skpd}/${subSKPD.id_sub_skpd}`)
              console.log(`Found ${bidangUrusanList.length} bidang urusan for SKPD ${skpd.id_skpd}, sub-SKPD ${subSKPD.id_sub_skpd}`)

              // Step 6: Process each bidang urusan
              for (const bidangUrusan of bidangUrusanList) {
                console.log(`Processing bidang urusan ID: ${bidangUrusan.id_bidang_urusan}`)

                try {
                  // Step 7: Fetch program for this SKPD, sub-SKPD, and bidang urusan
                  const programList = await this.makeRequest(`/pengeluaran/strict/dashboard/statistik-belanja/${skpd.id_skpd}/${subSKPD.id_sub_skpd}/${bidangUrusan.id_bidang_urusan}`)
                  console.log(`Found ${programList.length} programs for SKPD ${skpd.id_skpd}, sub-SKPD ${subSKPD.id_sub_skpd}, bidang urusan ${bidangUrusan.id_bidang_urusan}`)

                  // Step 8: Process each program
                  for (const program of programList) {
                    console.log(`Processing program ID: ${program.id_program}`)

                    try {
                      // Step 9: Fetch giat for this SKPD, sub-SKPD, bidang urusan, and program
                      const giatList = await this.makeRequest(`/pengeluaran/strict/dashboard/statistik-belanja/${skpd.id_skpd}/${subSKPD.id_sub_skpd}/${bidangUrusan.id_bidang_urusan}/${program.id_program}`)
                      console.log(`Found ${giatList.length} giats for SKPD ${skpd.id_skpd}, sub-SKPD ${subSKPD.id_sub_skpd}, bidang urusan ${bidangUrusan.id_bidang_urusan}, program ${program.id_program}`)

                      // Step 10: Process each giat
                      for (const giat of giatList) {
                        console.log(`Processing giat ID: ${giat.id_giat}`)

                        try {
                          // Step 11: Fetch sub-giat for this SKPD, sub-SKPD, bidang urusan, program, and giat
                          const subGiatList = await this.makeRequest(`/pengeluaran/strict/dashboard/statistik-belanja/${skpd.id_skpd}/${subSKPD.id_sub_skpd}/${bidangUrusan.id_bidang_urusan}/${program.id_program}/${giat.id_giat}`)
                          console.log(`Found ${subGiatList.length} sub-giats for SKPD ${skpd.id_skpd}, sub-SKPD ${subSKPD.id_sub_skpd}, bidang urusan ${bidangUrusan.id_bidang_urusan}, program ${program.id_program}, giat ${giat.id_giat}`)

                          // Step 12: Process each sub-giat
                          for (const subGiat of subGiatList) {
                            console.log(`Processing sub-giat ID: ${subGiat.id_sub_giat}`)

                            try {
                              // Step 13: Fetch final data
                              const finalData = await this.makeRequest(`/pengeluaran/strict/dashboard/statistik-belanja/${skpd.id_skpd}/${subSKPD.id_sub_skpd}/${bidangUrusan.id_bidang_urusan}/${program.id_program}/${giat.id_giat}/${subGiat.id_sub_giat}`)

                              // Process and flatten the final data
                              for (const item of finalData) {
                                this.counter++
                                // Create a flattened record with all the information
                                const flattenedRecord = {
                                  'NO': this.counter,
                                  'TAHUN': skpd.tahun,
                                  'KODE SKPD': skpd.kode_skpd,
                                  'NAMA SKPD': skpd.nama_skpd,
                                  'KODE SUB UNIT': subSKPD.kode_sub_skpd,
                                  'NAMA SUB UNIT': subSKPD.nama_sub_skpd,
                                  'KODE BIDANG URUSAN': bidangUrusan.kode_bidang_urusan,
                                  'NAMA BIDANG URUSAN': bidangUrusan.nama_bidang_urusan,
                                  'KODE PROGRAM': program.kode_program,
                                  'NAMA PROGRAM': program.nama_program,
                                  'KODE KEGIATAN': giat.kode_giat,
                                  'NAMA KEGIATAN': giat.nama_giat,
                                  'KODE SUB KEGIATAN': subGiat.kode_sub_giat,
                                  'NAMA SUB KEGIATAN': subGiat.nama_sub_giat,
                                  'KODE REKENING': item.kode_akun || '',
                                  'NAMA REKENING': item.nama_akun || '',
                                  'PAGU': item.anggaran || 0,
                                  'REALISASI': item.realisasi_rill || 0,
                                  'AKUN': item.kode_akun.substring(0, 1) || '',
                                  'KELOMPOK': item.kode_akun.substring(0, 3) || '',
                                  'JENIS': item.kode_akun.substring(0, 6) || '',
                                  'OBJEK': item.kode_akun.substring(0, 9) || '',
                                  'RINCIAN OBJEK': item.kode_akun.substring(0, 12) || '',
                                  'SUB RINCIAN OBJEK': item.kode_akun || '',
                                }

                                this.flattenedResults.push(flattenedRecord)
                              }
                            } catch (error) {
                              console.error(`Error processing sub-giat ${subGiat.id_sub_giat}:`, error.message)
                            }
                          }
                        } catch (error) {
                          console.error(`Error processing giat ${giat.id_giat}:`, error.message)
                        }
                      }
                    } catch (error) {
                      console.error(`Error processing program ${program.id_program}:`, error.message)
                    }
                  }
                } catch (error) {
                  console.error(`Error processing bidang urusan ${bidangUrusan.id_bidang_urusan}:`, error.message)
                }
              }
            } catch (error) {
              console.error(`Error processing sub-SKPD ${subSKPD.id_sub_skpd}:`, error.message)
            }
          }
        } catch (error) {
          console.error(`Error processing SKPD ${skpd.id_skpd}:`, error.message)
        }

        // Save intermediate results after each SKPD to prevent data loss
        await this.saveResults(`realisasi/skpd_${skpd.id_skpd}.json`)
      }

      // Save final results
      await this.saveResults('realisasi/realisasi_complete.json')
      console.log('All data processing completed successfully!')

      return this.flattenedResults
    } catch (error) {
      console.error('Error processing all data:', error.message)
      // Save whatever data we have so far
      await this.saveResults('realisasi_partial.json')
      throw error
    }
  }

  async getSKPDList () {
    try {
      await this.ensureOutputDirExists()
      const skpdList = await this.makeRequest('/pengeluaran/strict/dashboard/statistik-belanja')
      for (const [index, skpd] of skpdList.entries()) {
        console.log(`Processing SKPD ${index + 1}: ${skpd.nama_skpd} (ID: ${skpd.id_skpd})`)
        try {

          const subSKPDList = await this.makeRequest(`/pengeluaran/strict/dashboard/statistik-belanja/${skpd.id_skpd}`)
          console.log(`Found ${subSKPDList.length} sub-SKPDs for SKPD ${skpd.id_skpd}`)
          for (const subSKPD of subSKPDList) {
            console.log(`Processing sub-SKPD: ${subSKPD.nama_sub_skpd} (ID: ${subSKPD.id_sub_skpd})`)

            try {
              this.counter++
              // Create a flattened record with all the information
              const flattenedRecord = {
                'no': this.counter,
                'tahun': subSKPD.tahun,
                'id_skpd': subSKPD.id_skpd,
                'id_sub_skpd': subSKPD.id_sub_skpd,
                'kode_sub_unit': subSKPD.kode_sub_skpd,
                'nama_sub_unit': subSKPD.nama_sub_skpd,
              }
              this.flattenedResults.push(flattenedRecord)
            } catch (error) {
              console.error(`Error processing sub-SKPD ${subSKPD.id_sub_skpd}:`, error.message)
              throw error
            }
          }
        } catch (error) {
          console.error(`Error processing SKPD ${skpd.id_skpd}:`, error.message)
          throw error
        }
      }

      await this.saveResults('listSKPD.json')
      console.log('All data processing completed successfully!')
    } catch (error) {
      console.error('Error fetching SKPD list:', error.message)
      throw error
    }
  }

  // Save results to a file in the specified directory
  async saveResults (filename) {
    try {
      const filePath = path.join(this.outputDir, filename)
      await fs.writeFile(filePath, JSON.stringify(this.flattenedResults, null, 2))
      console.log(`Results saved to ${filePath}`)
    } catch (error) {
      console.error(`Error saving results to ${filename}:`, error.message)
    }
  }

}

// Main function to execute the recursive data fetching
async function main () {
  try {
    console.log('Starting recursive data fetching from SIPD Kemendagri with flattened output...')
    const client = new SIPDClient()

    // Process all data (optionally limit the number of SKPDs to process)
    // For example, to process only the first 3 SKPDs:
    // await client.processAllData(3);

    // To process all SKPDs:
    // await client.processAllData()
    await client.getSKPDList()

    console.log('Data fetching completed successfully!')
  } catch (error) {
    console.error('Failed to fetch all data:', error)
  }
}

main()
