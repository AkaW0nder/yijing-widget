//
//  Astronomy.swift
//  YiJing_Astro
//
//  Created by Kiron Geiger on 02.01.16.
//  Copyright © 2016 HTL Villach. All rights reserved.
//

import Foundation

class Astronomy {
    let VSOP87D_data = VSOP87D()
    let Nutation_coefficients = Nutation_terms()
    let Obliquity_coefficients = Obliquity_terms()
    
    let jd1900 : Double = 2415020.0
    let jd2000 : Double = 2451545.0
    let π = Double.pi
    let π2: Double
    let to_radians: Double
    
    let userCalendar =  calendar
    let UTC_timezone = TimeZone(identifier: "UTC")
    var dateComponents = DateComponents()
    let gregoriancalendar_start: Date
    
    var L0: Double = 0.0                  // Sun´s mean longitude                             (27.2) Meus p. 171
    var D_degree: Double = 0.0            // mean elongation of Moon from the Sun     = D     Meeus chapter 21, p. 132
    var mean_Anomaly_Sun: Double = 0.0    // mean anomaly of Sun (Earth)              = M
    var mean_Anomaly_Moon: Double = 0.0   // mean anomaly of Moon, Mprime             = M'
    var latitude_Moon: Double = 0.0       // Moon´s argument of latitude              = F
    var Ω: Double = 0.0                   // longitude of Moon´s mean orbit´s ascending node  = Omega Ω
    
    var Δψ: Double = 0.0                  // deltaPsi     = nutation in longitude       in degrees
    var Δε: Double = 0.0                  // deltaEpsilon = obliquity                   in degrees
    
    var ε_mean: Double = 0.0              // mean obliquity of the ecliptic
    var ε: Double = 0.0                   // true obliquity of the ecliptic
    
    var λ_rad: Double = 0.0               // Sun´s longitude
    var α: Double = 0.0                   // right ascension α ( Alpha )
    
    let sun_motion: Double
    
    init () {
        π2 = π * 2.0
        to_radians = π/180.0
        
        sun_motion = 365.25 / π2        // -> ca. 58.0
        
        
        self.dateComponents.year = 1582
        self.dateComponents.month = 10
        self.dateComponents.day = 15
        self.dateComponents.timeZone = UTC_timezone
        gregoriancalendar_start = userCalendar!.date(from: dateComponents)!
    }
    
    //  **************************************************************************************************
    /** Calculates the number of julian days elapsed since jan 0.5 4712 BC, from a date and an hour. */
    
    // return error if days falls on non-existing 10/5/1582 - 10/14/1582
    
    func UTC_to_julianDate(_ UTC_hour: Int, UTC_minute: Double, UTC_day: Int, UTC_month: Int, UTC_year: Int ) -> Double {
        
        
        let dayToCalc: Double = Double(UTC_day) + ( Double(UTC_hour) + UTC_minute / 60.0) / 24.0
        var monthToCalc = UTC_month
        var yearToCalc = Double(UTC_year)
        
        if monthToCalc < 3 { monthToCalc += 12; yearToCalc -= 1 }
        
        // If the date is later than 1582 October 15
        
        dateComponents.year = UTC_year
        dateComponents.month = UTC_month
        dateComponents.day = UTC_day
        dateComponents.timeZone = UTC_timezone
        let convertedDay = userCalendar!.date(from: dateComponents)!
        
        var B: Double  = 0 // result 0 if NSOrderedAscending ie convertedDay comes BEFORE gregoriancalendar_start i.e. in the Gregorian calendar
        
        if convertedDay.compare(gregoriancalendar_start) == .orderedDescending { // convertedDay comes after gregoriancalendar_start i.e. in the Gregorian calendar
            let year_div100 = floor( yearToCalc / 100 )
            B = 2 - year_div100 + floor( year_div100 / 4 )
        }
        
        let C: Double = yearToCalc < 0 ? floor(365.25 * Double(yearToCalc) - 0.75 ) : floor(365.25 * Double(yearToCalc) )
        
        return B + C + floor(30.6001 * ( Double(monthToCalc) + 1)) + dayToCalc + 1720994.5
    }
    
    //  **************************************************************************************************
    // Transforms julian days to UTC time
    
    func JD_to_UTC(_ juliandate: Double) -> ( hour: Int, min: Int, sec: Int, day: Int, month: Int, year: Int ) {
        var juliandate = juliandate
        juliandate += 0.5
        let JD_int = trunc( juliandate )
        let JD_fract = juliandate - JD_int
        
        var a = JD_int
        
        if JD_int >= 2299161 {
            let alpha = trunc((JD_int - 1867216.25) / 36524.25)
            a = JD_int + 1.0 + alpha - trunc(alpha / 4.0 )
        }
        
        let b = a + 1524.0
        
        let c = trunc((b - 122.1) / 365.25)
        
        let d = trunc(365.25 * c)
        
        let e = trunc((b - d) / 30.6001)
        
        let day = b - d + JD_fract - trunc(30.6001 * e)
        
        let month = e < 14.0 ? Int(e - 1.0) : Int(e - 13.0)
        
        let hour_min_sec = JD_fract * 86400.0 + 0.5 // + 0.5 to round it up if necessary
        
        return ( Int(hour_min_sec / 3600.0), Int((hour_min_sec / 60.0).truncatingRemainder(dividingBy: 60.0)), Int(hour_min_sec.truncatingRemainder(dividingBy: 60.0)),
            Int(day), month, month > 2 ? Int(c - 4716) : Int(c - 4715) )
    }
    
    
    //  **************************************************************************************************
    // Normalizes the input angle to an equivalent positive angle between 0 and 360
    func range_0_360(_ angle: Double) -> Double {
        if ( angle >= 0.0 ) { return fmod(angle, 360.0) }   //  The fmod() functions compute the floating-point remainder of x/ y.
        else { return 360.0 + fmod(angle, 360.0) }
    }
    
    //  **************************************************************************************************
    // Normalizes the input angle to an equivalent positive angle between 0 and 360
    func range_0_2Pi(_ angle: Double) -> Double {
        if ( angle >= 0.0 ) { return fmod(angle, π2) }
        else { return π2 + fmod(angle, π2) }
    }
    
    // **********************************    Nutation   *************************************************
    
    /*  Calculate the nutation in longitude = deltaPsi, and obliquity = deltaEpsilon for a given Julian date
    Results are returned in degrees.
    */
    
    func nutation_Long_Obliqu(_ julianDate: Double) -> ( deltaPsi: Double, deltaEpsilon: Double ) {
        let t = (julianDate - self.jd2000) / 36525.0
        let t2 = t * t          // Tsquared
        let t3 = t * t2         // Tcubed
        
        // mean elongation of Moon from the Sun         = D
        self.D_degree = range_0_360(297.850363 + 445267.11148 * t - 0.0019142 * t2 + t3 / 189474.0)
        // mean anomaly of Sun (Earth)                  = M
        self.mean_Anomaly_Sun = range_0_360(357.52772 + 35999.05034 * t - 0.0001603 * t2 - t3 / 300000.0)
        // mean anomaly of Moon, Mprime                 = M'
        self.mean_Anomaly_Moon = range_0_360(134.96298 + 477198.867398 * t + 0.0086972 * t2 + t3 / 56250.0)
        // Moon´s argument of latitude                  = F
        self.latitude_Moon = range_0_360(93.27191 + 483202.017538 * t - 0.0036825 * t2 + t3 / 327270)
        // longitude of Moon´s mean orbit´s ascending node  = Omega Ω
        self.Ω = range_0_360(125.04452 - 1934.136261 * t + 0.0020708 * t2 + t3 / 450000.0)
        
        Δψ = 0.0    // deltaPsi     = nutation in longitude
        Δε = 0.0    // deltaEpsilon = obliquity
        
        var argument: Double
        
        // Nutation_coefficients: D    M    M´/Mprime  F   Ω   sincoeff1   sincoeff2   coscoeff1   coscoeff2
        
        for i in 0..<63 {
            argument  = Nutation_coefficients.terms[i][0] * D_degree
            argument += Nutation_coefficients.terms[i][1] * mean_Anomaly_Sun
            argument += Nutation_coefficients.terms[i][2] * mean_Anomaly_Moon
            argument += Nutation_coefficients.terms[i][3] * latitude_Moon
            argument += Nutation_coefficients.terms[i][4] * Ω
            argument *= to_radians
            
            Δψ += (Nutation_coefficients.terms[i][5] + Nutation_coefficients.terms[i][6] * t) * sin(argument)
            Δε += (Nutation_coefficients.terms[i][7] + Nutation_coefficients.terms[i][8] * t) * cos(argument)
        }
        
        // converting from ten thousandths of arcseconds to radians in the process.
        
        Δψ /= (3600.0 * 10000.0)
        Δε /= (3600.0 * 10000.0)
        
        return ( Δψ, Δε )           // Results are returned in degrees
    }
    
    
    // **********************************    VSOP87   *************************************************
    
    
    func VSOP87_calc_terms(_ terms: [[Double]], terms_count: Int, t: Double) -> Double {
        var value = 0.0
        
        for i in 0..<terms_count {
            value += terms[i][0] * cos(terms[i][1] + terms[i][2] * t)
        }
        
        return value
    }
    
    func VSOP87_earth_geocentric(_ JD: Double) -> (L: Double, B: Double, R: Double) {
        var t, t2, t3, t4, t5: Double
        var L, B, R: Double
        var L0, L1, L2, L3, L4, L5: Double
        var B0, B1, B2, B3, B4: Double
        var R0, R1, R2, R3, R4, R5: Double
        
        let to_radians = Double.pi/180.0
        
        // get julian ephemeris day
        
        t = (JD - self.jd2000) / 365250.0
        t2 = t * t
        t3 = t2 * t
        t4 = t3 * t
        t5 = t4 * t
        
        /* calc L series
        ecliptical longitude
        VSOP87D_L0_EARTH 559
        VSOP87D_L1_EARTH 341
        VSOP87D_L2_EARTH 142
        VSOP87D_L3_EARTH 22
        VSOP87D_L4_EARTH 11
        VSOP87D_L5_EARTH 5
        */
        L0 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_L0_EARTH, terms_count: 559, t: t)
        L1 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_L1_EARTH, terms_count: 341, t: t)
        L2 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_L2_EARTH, terms_count: 142, t: t)
        L3 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_L3_EARTH, terms_count: 22, t: t)
        L4 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_L4_EARTH, terms_count: 11, t: t)
        L5 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_L5_EARTH, terms_count: 5, t: t)
        
        L = L0 + L1 * t + L2 * t2 + L3 * t3 + L4 * t4 + L5 * t5
        L = range_0_2Pi(L)
        
        /* calc B series
        ecliptical latitude
        VSOP87D_B0_EARTH 184
        VSOP87D_B1_EARTH 99
        VSOP87D_B2_EARTH 49
        VSOP87D_B3_EARTH 11
        VSOP87D_B4_EARTH 5
        VSOP87D_B5_EARTH is empty!!!
        */
        B0 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_B0_EARTH, terms_count: 184, t: t)
        B1 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_B1_EARTH, terms_count: 99, t: t)
        B2 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_B2_EARTH, terms_count: 49, t: t)
        B3 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_B3_EARTH, terms_count: 11, t: t)
        B4 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_B4_EARTH, terms_count: 5, t: t)
        
        B = B0 + B1 * t + B2 * t2 + B3 * t3 + B4 * t4
        // range_0_2Pi(B)    B will not exceed range of +-2 Pi
        
        
        /* calc R series
        the distance in AU between the Sun and Earth for the given julian day
        VSOP87D_R0_EARTH 526
        VSOP87D_R1_EARTH 292
        VSOP87D_R2_EARTH 139
        VSOP87D_R3_EARTH 27
        VSOP87D_R4_EARTH 10
        VSOP87D_R5_EARTH 3
        */
        R0 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_R0_EARTH, terms_count: 526, t: t)
        R1 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_R1_EARTH, terms_count: 292, t: t)
        R2 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_R2_EARTH, terms_count: 139, t: t)
        R3 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_R3_EARTH, terms_count: 27, t: t)
        R4 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_R4_EARTH, terms_count: 10, t: t)
        R5 = VSOP87_calc_terms(VSOP87D_data.VSOP87D_R5_EARTH, terms_count: 3, t: t)
        R = R0 + R1 * t + R2 * t2 + R3 * t3 + R4 * t4 + R5 * t5
        
        // Transform from VSOP87 to FK5 reference frame (31.3) p. 207
        
        
        // get julian centuries from 2000
        let t_century = t * 10
        
        L += Double.pi
        B = 0 - B
        
        let LL =  L + ((-1.397 - 0.00031 * t_century) * t_century ) * to_radians
        let cos_LL = cos(LL)
        let sin_LL = sin(LL)
        
        let ΔL = (-0.09033 / 3600.0) + (0.03916 / 3600.0) * (cos_LL + sin_LL) * tan(B)
        let ΔB = (0.03916 / 3600.0) * (cos_LL - sin_LL)
        
        let nutation = nutation_Long_Obliqu(JD) // Results are returned in degrees
        
        let aberration = -20.4898 / 3600 / R
        
        L += to_radians * ( ΔL  + nutation.deltaPsi  + aberration )
        B += ΔB * to_radians
        
        self.λ_rad = L
        
        return (L, B, R)
    }
    
    // shortcut function to transform UTC_date to ecliptic degree
    
    func UTC_to_sunpos(_ UTC_date: DateComponents) -> Double
    {
        return VSOP87_earth_geocentric( UTC_to_julianDate(UTC_date.hour!, UTC_minute: Double(UTC_date.minute!), UTC_day: UTC_date.day!, UTC_month: UTC_date.month!, UTC_year: UTC_date.year! ) ).L / to_radians
    }
    
    // **********************************    Equation of Time   *************************************************
    
    func EoT(_ JD: Double) -> Double {
        let τ = (JD - jd2000) / 36525.0 // τ = number of Julian centuries since 2000
        let τo10 = τ / 10.0         // number of Julian Milleniums since 2000
        let u = τo10 / 10   //  number of Julian 10.000 years since 2000
        
        // Sun´s mean longitude in (27.2) Meus p. 171
        self.L0 = range_0_360(280.4664567 + τo10 * (360007.6982779  + τo10 * (0.03032028  + (τo10  * ( 1 / 49931 - τo10 * ( 1 / 15299 + τo10 / 1988000)) ))))
        
        _ = VSOP87_earth_geocentric(JD)
        
        /*  Compute the mean and true obliquity of the ecliptic
        from Meeus S. 135 (21.3) auf 0.01´´ genau zwischen AD 1000 bis 3000
        by John Walker  --  September, MIM
        http://www.fourmilab.ch/
        
        Calculate the obliquity of the ecliptic for a given Julian date.  This uses Laskar's tenth-degree
        polynomial fit (J. Laskar, Astronomy and Astrophysics, Vol. 157, page 68 [1986]) which is
        accurate to within 0.01 arc second between AD 1000 and AD 3000, and within a few seconds of arc for
        +/-10000 years around AD 2000.  If we're outside the range in which this fit is valid (deep time) we
        simply return the J2000 value of the obliquity, which happens to be almost precisely the mean.          */
        
        
        var v = u
        
        self.ε_mean = 23 + (26 / 60.0) + (21.448 / 3600.0)  // 23° 26´ 21.448´´
        
        if fabs(u) < 1.0 {     // otherwise if more than 10000 years from jd2000 -> formula inaccurate
            for i in Obliquity_coefficients.obliqu_factors {
                ε_mean += i * v                            // calculate mean obliquity of the ecliptic
                v *= u
            }
        }
        
        self.ε = ε_mean + Δε  // calculate true obliquity of the ecliptic
        
        let ε_rad = ε * to_radians
        
        // !!!!!!!!!!!!!!!!!! assumes that Sun´s longitude has been calculated BEFORE!!!!!!!!!!!
        
        self.α = range_0_360( atan2(sin(λ_rad) * cos(ε_rad), cos(λ_rad)) / to_radians ) // right ascension α ( Alpha )
        
        return L0 - 0.0057183 - α + Δψ * cos(ε_rad)    // equation_of_time_meeus (27.1) p. 171, in degrees
    }
    
    // ****************************    Equinoxes & Chinese Months = solar terms   *****************************************
    
    
    let JDE0tab1000 = [                                                     // terms for mean equinox and solstices.  set #1 for years -1000 to +1000
        [ 1721139.29189, 365242.13740,  0.06134,  0.00111, -0.00071 ],
        [ 1721233.25401, 365241.72562, -0.05323,  0.00907,  0.00025 ],
        [ 1721325.70455, 365242.49558, -0.11677, -0.00297,  0.00074 ],
        [ 1721414.39987, 365242.88257, -0.00769, -0.00933, -0.00006 ] ]
    
    let JDE0tab2000 = [                                                     // terms for mean equinox and solstices.  set #2 for years +1000 to +3000
        [ 2451623.80984, 365242.37404,  0.05169, -0.00411, -0.00057 ],
        [ 2451716.56767, 365241.62603,  0.00325,  0.00888, -0.00030 ],
        [ 2451810.21715, 365242.01767, -0.11575,  0.00337,  0.00078 ],
        [ 2451900.05952, 365242.74049, -0.06223, -0.00823,  0.00032 ] ]
    
    let equi_solstices = [ 270.0 * Double.pi / 180.0,
        0.0,
        90.0 * Double.pi / 180.0,
        180.0 * Double.pi / 180.0,
        270.0 * Double.pi / 180.0 ]
    
    
    func correct_Degree(_ degree: Double, JD: Double) -> Double {
        var JD = JD
        var correction: Double
        
        repeat {
            correction = sun_motion * sin(degree - VSOP87_earth_geocentric(JD).0)
            JD += correction
        } while (fabs(correction) > 0.00005) // 0.00001 Corresponds to an error of 0.86 of a second
        
        return JD
    }
    
    func equinox(year: Int) -> [Double] { // (preJDE_270_deg: Double, JDE_000_deg: Double, JDE_090_deg: Double, JDE_180_deg: Double, JDE_270_deg: Double ) {
        
        let JDE0tab: [[Double]]
        var Y_prev, Y: Double
        
        if (year < 1000) {
            JDE0tab = JDE0tab1000
            Y_prev = Double(year - 1) / 1000.0
            Y = Double(year) / 1000.0
        } else {
            JDE0tab = JDE0tab2000
            Y_prev = ( Double(year - 1) - 2000.0) / 1000.0
            Y = ( Double(year) - 2000.0) / 1000.0
        }
        
        var JDE0 = [Double](repeating: 0.0 , count: 5)
        var season: Int = 3 // start with 270° of previous year
        var Y_actual: Double = Y_prev
        var Y_potency: Double
        
        for anno in 0..<5 {
            
            JDE0[anno] = JDE0tab[season][0]
            Y_potency = Y_actual
            
            for potency in 1...4 {
                JDE0[anno] += Y_potency * JDE0tab[season][potency]
                Y_potency *= Y_actual
            }                                                       // result is approximate date
            
            JDE0[anno] = correct_Degree(equi_solstices[anno], JD: JDE0[anno])
            
            if season == 3 { season = 0; Y_actual = Y } else { season += 1 }
        }
        
        return JDE0                  // ( JDE0[0], JDE0[1], JDE0[2], JDE0[3], JDE0[4] )
    }
    
    // calculate JieQi from 255° previous chin. year = around Jan-start to 315° of next chinese year = end of current year
    // precalculated:     preJDE_270          JDE_000_deg         JDE_090_deg         JDE_180_deg             JDE_270_deg
    
    func JieQi(_ equ_solst: [Double] ) -> [Double] {
        
        var JDE = [Double](repeating: 0.0 , count: 15)
        
        var degree: Double = 255.0 * to_radians
        let delta: Double = π2 / 12.0           // 12tel eines Jahres = Monatsäquivalent
        // var counter:Int = 0
        
        for i in 0..<15 {
            JDE[i] = correct_Degree(degree, JD: equ_solst[i / 3])
            
            degree += delta
            
        }
        
        return JDE
    }
    /*
    // calculate array of julian_days for 1 chinese month = jieqi in steps of 1°
    
    func JieQi_correction( JDE: Double, degree_perfect: Double) -> Double {
    let arcsecond = 1.0 / 3600.0                             // accuracy: 1 arcsecond of Sun = 24 seconds of Time
    
    var equi = JDE
    var degree_current = self.Sun_app_long(JDE) / to_radians
    
    let sun_motion = 365.25 / π2 // -> ca. 58.0
    
    while fabs(degree_current - degree_perfect) > arcsecond {
    equi += sun_motion * sin( to_radians * ( degree_perfect - degree_current ) )         // (26.1) Meeus p. 168
    
    degree_current = self.Sun_app_long(equi) / to_radians
    }
    
    return equi
    }   
    */
    
    func JieQi_month_days(_ JD_start: Double, JD_end: Double, degree_start: Int ) -> [Double] {
      var JD_array = [Double](repeating: 0.0 , count: 31)
    
      JD_array[0] = JD_start
    
      var degree = Double(degree_start) * to_radians
      let delta: Double = π2 / 360.0           // 360tel eines Jahres = Tagesäquivalent
    
      for i in 1..<15 {
        degree += delta
        
        JD_array[i] = correct_Degree(degree, JD: JD_start )
      }
    
      for i in 15..<30 {
        degree += delta
        
        JD_array[i] = correct_Degree(degree, JD: JD_end )
      }
    
      JD_array[30] = JD_end
    
      return JD_array
    }

}
