"use client";

import React, { useState, useRef, useEffect, JSX } from 'react';
import { useRouter } from "next/navigation";
import { Search } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NYC Bus Schedules | MTA Bus Finder',
  description: 'Find real-time New York City bus schedules, stop locations, and arrival times for all boroughs.',
};

type Borough = 'Bronx' | 'Brooklyn' | 'Queens' | 'Manhattan' | 'Staten Island';
type RouteInfo = {
  name: string;
  link: string;
};
type RouteGroup = {
  header: string;
  routes: RouteInfo[];
};
type BoroughRoutes = Record<Borough, RouteGroup[]>;

  const boroughRoutes: BoroughRoutes = {
    Bronx: [
      {
        header: "Local/limited/SBS routes",
        routes: [
          { name: 'Bx1/Bx2', link: 'https://new.mta.info/document/88706' },
          { name: 'Bx3', link: 'https://new.mta.info/document/88711' },
          { name: 'Bx4/Bx4a', link: 'https://new.mta.info/document/88691' },
          { name: 'Bx5', link: 'https://new.mta.info/document/88716' },
          { name: 'Bx6', link: 'https://new.mta.info/document/88796' },
          { name: 'Bx6-SBS', link: 'https://new.mta.info/document/88801' },
          { name: 'Bx7', link: 'https://new.mta.info/document/88806' },
          { name: 'Bx8', link: 'https://new.mta.info/document/88811' },
          { name: 'Bx9', link: 'https://new.mta.info/document/88816' },
          { name: 'Bx10', link: 'https://new.mta.info/document/88821' },
          { name: 'Bx11', link: 'https://new.mta.info/document/88696' },
          { name: 'Bx12', link: 'https://new.mta.info/document/88826' },
          { name: 'Bx12-SBS', link: 'https://new.mta.info/document/88831' },
          { name: 'Bx13', link: 'https://new.mta.info/document/88836' },
          { name: 'Bx15', link: 'https://new.mta.info/document/88701' },
          { name: 'Bx16', link: 'https://new.mta.info/document/88841' },
          { name: 'Bx17', link: 'https://new.mta.info/document/88846' },
          { name: 'Bx18', link: 'https://new.mta.info/document/88741' },
          { name: 'Bx19', link: 'https://new.mta.info/document/88851' },
          { name: 'Bx20', link: 'https://new.mta.info/document/88856' },
          { name: 'Bx21', link: 'https://new.mta.info/document/88861' },
          { name: 'Bx22', link: 'https://new.mta.info/document/88866' },
          { name: 'Bx23', link: 'https://new.mta.info/document/88871' },
          { name: 'Bx24', link: 'https://new.mta.info/document/88746' },
          { name: 'Bx25', link: 'https://new.mta.info/document/88751' },
          { name: 'Bx26', link: 'https://new.mta.info/document/88876' },
          { name: 'Bx27', link: 'https://new.mta.info/document/88881' },
          { name: 'Bx28/Bx38', link: 'https://new.mta.info/document/88886' },
          { name: 'Bx29', link: 'https://new.mta.info/document/88756' },
          { name: 'Bx30', link: 'https://new.mta.info/document/88761' },
          { name: 'Bx31', link: 'https://new.mta.info/document/88891' },
          { name: 'Bx32', link: 'https://new.mta.info/document/88896' },
          { name: 'Bx33', link: 'https://new.mta.info/document/88901' },
          { name: 'Bx34', link: 'https://new.mta.info/document/88906' },
          { name: 'Bx35', link: 'https://new.mta.info/document/88766' },
          { name: 'Bx36', link: 'https://new.mta.info/document/88771' },
          { name: 'Bx39', link: 'https://new.mta.info/document/88911' },
          { name: 'Bx41', link: 'https://new.mta.info/document/88916' },
          { name: 'Bx40/Bx42', link: 'https://new.mta.info/document/88776' },
          { name: 'Bx41-SBS', link: 'https://new.mta.info/document/88921' },
          { name: 'Bx46', link: 'https://new.mta.info/document/88926' }
        ]
      },
      {
        header: "Express Bus Routes",
        routes: [
          { name: 'BxM1', link: 'https://new.mta.info/document/88721' },
          { name: 'BxM2', link: 'https://new.mta.info/document/88726' },
          { name: 'BxM3', link: 'https://new.mta.info/document/88941' },
          { name: 'BxM4', link: 'https://new.mta.info/document/88946' },
          { name: 'BxM6', link: 'https://new.mta.info/document/88951' },
          { name: 'BxM7', link: 'https://new.mta.info/document/88956' },
          { name: 'BxM8', link: 'https://new.mta.info/document/88961' },
          { name: 'BxM9', link: 'https://new.mta.info/document/88966' },
          { name: 'BxM10', link: 'https://new.mta.info/document/88971' },
          { name: 'BxM11', link: 'https://new.mta.info/document/88976' },
          { name: 'BxM18', link: 'https://new.mta.info/document/88936' }
        ]
      }
    ],
    Brooklyn: [
      {
        header: "Express Routes BM1-X38",
        routes: [
          { name: 'BM1', link: 'https://new.mta.info/document/14041' },
          { name: 'BM2', link: 'https://new.mta.info/document/6891' },
          { name: 'BM3', link: 'https://new.mta.info/document/6896' },
          { name: 'BM4', link: 'https://new.mta.info/document/14046' },
          { name: 'BM5', link: 'https://new.mta.info/document/14051' },
          { name: 'X27', link: 'https://new.mta.info/document/6921' },
          { name: 'X28', link: 'https://new.mta.info/document/6916' },
          { name: 'X37', link: 'https://new.mta.info/document/6921' },
          { name: 'X38', link: 'https://new.mta.info/document/6916' }
        ]
      },
      {
        header: "Local and Limited Service B1-B20",
        routes: [
          { name: 'B1', link: 'https://new.mta.info/document/6926' },
          { name: 'B2', link: 'https://new.mta.info/document/6936' },
          { name: 'B3', link: 'https://new.mta.info/document/6941' },
          { name: 'B4', link: 'https://new.mta.info/document/6946' },
          { name: 'B6', link: 'https://new.mta.info/document/6951' },
          { name: 'B7', link: 'https://new.mta.info/document/6956' },
          { name: 'B8', link: 'https://new.mta.info/document/6961' },
          { name: 'B9', link: 'https://new.mta.info/document/6966' },
          { name: 'B11', link: 'https://new.mta.info/document/6971' },
          { name: 'B12', link: 'https://new.mta.info/document/6976' },
          { name: 'B13', link: 'https://new.mta.info/document/6981' },
          { name: 'B14', link: 'https://new.mta.info/document/6986' },
          { name: 'B15', link: 'https://new.mta.info/document/6991' },
          { name: 'B16', link: 'https://new.mta.info/document/6996' },
          { name: 'B17', link: 'https://new.mta.info/document/7001' },
          { name: 'B20', link: 'https://new.mta.info/document/7006' }
        ]
      },
      {
        header: "Local and Limited Service B24-B41",
        routes: [
          { name: 'B24', link: 'https://new.mta.info/document/7011' },
          { name: 'B25', link: 'https://new.mta.info/document/7016' },
          { name: 'B26', link: 'https://new.mta.info/document/7021' },
          { name: 'B31', link: 'https://new.mta.info/document/7026' },
          { name: 'B32', link: 'https://new.mta.info/document/7031' },
          { name: 'B35', link: 'https://new.mta.info/document/7036' },
          { name: 'B36', link: 'https://new.mta.info/document/7041' },
          { name: 'B37', link: 'https://new.mta.info/document/7046' },
          { name: 'B38', link: 'https://new.mta.info/document/7051' },
          { name: 'B39', link: 'https://new.mta.info/document/7056' },
          { name: 'B41', link: 'https://new.mta.info/document/7061' }
        ]
      },
      {
        header: "Local and Limited Service B42-B61",
        routes: [
          { name: 'B42', link: 'https://new.mta.info/document/7066' },
          { name: 'B43', link: 'https://new.mta.info/document/7071' },
          { name: 'B44', link: 'https://new.mta.info/document/7076' },
          { name: 'B44-SBS', link: 'https://new.mta.info/document/7081' },
          { name: 'B45', link: 'https://new.mta.info/document/7086' },
          { name: 'B46', link: 'https://new.mta.info/document/13886' },
          { name: 'B46-SBS', link: 'https://new.mta.info/document/7091' },
          { name: 'B47', link: 'https://new.mta.info/document/7096' },
          { name: 'B48', link: 'https://new.mta.info/document/7101' },
          { name: 'B49', link: 'https://new.mta.info/document/7106' },
          { name: 'B52', link: 'https://new.mta.info/document/7111' },
          { name: 'B54', link: 'https://new.mta.info/document/7116' },
          { name: 'B57', link: 'https://new.mta.info/document/7121' },
          { name: 'B60', link: 'https://new.mta.info/document/7126' },
          { name: 'B61', link: 'https://new.mta.info/document/7131' }
        ]
      },
      {
        header: "Local and Limited Service B62-B103",
        routes: [
          { name: 'B62', link: 'https://new.mta.info/document/7136' },
          { name: 'B63', link: 'https://new.mta.info/document/7141' },
          { name: 'B64', link: 'https://new.mta.info/document/7146' },
          { name: 'B65', link: 'https://new.mta.info/document/7151' },
          { name: 'B67', link: 'https://new.mta.info/document/7156' },
          { name: 'B68', link: 'https://new.mta.info/document/7161' },
          { name: 'B69', link: 'https://new.mta.info/document/7156' },
          { name: 'B70', link: 'https://new.mta.info/document/7171' },
          { name: 'B74', link: 'https://new.mta.info/document/7176' },
          { name: 'B82', link: 'https://new.mta.info/document/7181' },
          { name: 'B82-SBS', link: 'https://new.mta.info/document/7186' },
          { name: 'B83', link: 'https://new.mta.info/document/7191' },
          { name: 'B84', link: 'https://new.mta.info/document/7196' },
          { name: 'B100', link: 'https://new.mta.info/document/10281' },
          { name: 'B103', link: 'https://new.mta.info/document/10361' }
        ]
      }
    ],
    Manhattan: [
      {
        header: "Local and Limited Service M1-M15",
        routes: [
          { name: 'M1', link: 'https://new.mta.info/document/7501' },
          { name: 'M2', link: 'https://new.mta.info/document/7506' },
          { name: 'M3', link: 'https://new.mta.info/document/7511' },
          { name: 'M4', link: 'https://new.mta.info/document/7516' },
          { name: 'M5', link: 'https://new.mta.info/document/7521' },
          { name: 'M7', link: 'https://new.mta.info/document/7526' },
          { name: 'M8', link: 'https://new.mta.info/document/7531' },
          { name: 'M9', link: 'https://new.mta.info/document/9706' },
          { name: 'M10', link: 'https://new.mta.info/document/7541' },
          { name: 'M11', link: 'https://new.mta.info/document/7546' },
          { name: 'M12', link: 'https://new.mta.info/document/7551' },
          { name: 'M14-SBS', link: 'https://new.mta.info/document/7556' },
          { name: 'M15', link: 'https://new.mta.info/document/7561' },
          { name: 'M15-SBS', link: 'https://new.mta.info/document/7566' }
        ]
      },
      {
        header: "Local Service M20-M60",
        routes: [
          { name: 'M20', link: 'https://new.mta.info/document/7571' },
          { name: 'M21', link: 'https://new.mta.info/document/7576' },
          { name: 'M22', link: 'https://new.mta.info/document/7581' },
          { name: 'M23-SBS', link: 'https://new.mta.info/document/7586' },
          { name: 'M31', link: 'https://new.mta.info/document/7591' },
          { name: 'M34-SBS', link: 'https://new.mta.info/document/7596' },
          { name: 'M34A-SBS', link: 'https://new.mta.info/document/7596' },
          { name: 'M35', link: 'https://new.mta.info/document/7606' },
          { name: 'M42', link: 'https://new.mta.info/document/7611' },
          { name: 'M50', link: 'https://new.mta.info/document/7616' },
          { name: 'M55', link: 'https://new.mta.info/document/7621' },
          { name: 'M57', link: 'https://new.mta.info/document/7626' },
          { name: 'M60-SBS', link: 'https://new.mta.info/document/7631' }
        ]
      },
      {
        header: "Local and Limited Service M66-M125",
        routes: [
          { name: 'M66', link: 'https://new.mta.info/document/7636' },
          { name: 'M72', link: 'https://new.mta.info/document/7641' },
          { name: 'M79-SBS', link: 'https://new.mta.info/document/7646' },
          { name: 'M86-SBS', link: 'https://new.mta.info/document/7651' },
          { name: 'M96', link: 'https://new.mta.info/document/7656' },
          { name: 'M98', link: 'https://new.mta.info/document/7661' },
          { name: 'M100', link: 'https://new.mta.info/document/88781' },
          { name: 'M101', link: 'https://new.mta.info/document/8036' },
          { name: 'M102', link: 'https://new.mta.info/document/7676' },
          { name: 'M103', link: 'https://new.mta.info/document/7681' },
          { name: 'M104', link: 'https://new.mta.info/document/7686' },
          { name: 'M106', link: 'https://new.mta.info/document/7691' },
          { name: 'M116', link: 'https://new.mta.info/document/7696' },
          { name: 'M125', link: 'https://new.mta.info/document/88786' }
        ]
      }
    ],
    Queens: [
      {
        header: "Local and Limited Service Q1-Q25",
        routes: [
          { name: 'Q1', link: 'https://new.mta.info/document/6256' },
          { name: 'Q2', link: 'https://new.mta.info/document/6266' },
          { name: 'Q3', link: 'https://new.mta.info/document/6271' },
          { name: 'Q4', link: 'https://new.mta.info/document/6276' },
          { name: 'Q5', link: 'https://new.mta.info/document/6281' },
          { name: 'Q6', link: 'https://new.mta.info/document/6286' },
          { name: 'Q7', link: 'https://new.mta.info/document/10231' },
          { name: 'Q8', link: 'https://new.mta.info/document/6306' },
          { name: 'Q9', link: 'https://new.mta.info/document/6311' },
          { name: 'Q10', link: 'https://new.mta.info/document/6316' },
          { name: 'Q11', link: 'https://new.mta.info/document/6321' },
          { name: 'Q12', link: 'https://new.mta.info/document/6356' },
          { name: 'Q13', link: 'https://new.mta.info/document/6361' },
          { name: 'Q15/Q15A', link: 'https://new.mta.info/document/6366' },
          { name: 'Q16', link: 'https://new.mta.info/document/6376' },
          { name: 'Q17', link: 'https://new.mta.info/document/6381' },
          { name: 'Q18', link: 'https://new.mta.info/document/6386' },
          { name: 'Q19', link: 'https://new.mta.info/document/6391' },
          { name: 'Q20', link: 'https://new.mta.info/document/6396' },
          { name: 'Q21', link: 'https://new.mta.info/document/6321' },
          { name: 'Q22', link: 'https://new.mta.info/document/6406' },
          { name: 'Q23', link: 'https://new.mta.info/document/6416' },
          { name: 'Q24', link: 'https://new.mta.info/document/6421' },
          { name: 'Q25', link: 'https://new.mta.info/document/6426' }
        ]
      },
      {
        header: "Local and Limited Service Q26-Q55",
        routes: [
          { name: 'Q26', link: 'https://new.mta.info/document/6431' },
          { name: 'Q27', link: 'https://new.mta.info/document/6436' },
          { name: 'Q28', link: 'https://new.mta.info/document/6441' },
          { name: 'Q29', link: 'https://new.mta.info/document/6446' },
          { name: 'Q30', link: 'https://new.mta.info/document/6451' },
          { name: 'Q31', link: 'https://new.mta.info/document/6456' },
          { name: 'Q32', link: 'https://new.mta.info/document/6461' },
          { name: 'Q33', link: 'https://new.mta.info/document/6466' },
          { name: 'Q34', link: 'https://new.mta.info/document/6426' },
          { name: 'Q35', link: 'https://new.mta.info/document/10356' },
          { name: 'Q36', link: 'https://new.mta.info/document/6481' },
          { name: 'Q37', link: 'https://new.mta.info/document/6486' },
          { name: 'Q38', link: 'https://new.mta.info/document/6491' },
          { name: 'Q39', link: 'https://new.mta.info/document/6496' },
          { name: 'Q40', link: 'https://new.mta.info/document/6501' },
          { name: 'Q41', link: 'https://new.mta.info/document/6506' },
          { name: 'Q42', link: 'https://new.mta.info/document/6511' },
          { name: 'Q43', link: 'https://new.mta.info/document/6516' },
          { name: 'Q44-SBS', link: 'https://new.mta.info/document/6521' },
          { name: 'Q46', link: 'https://new.mta.info/document/6526' },
          { name: 'Q47', link: 'https://new.mta.info/document/14056' },
          { name: 'Q48', link: 'https://new.mta.info/document/6536' },
          { name: 'Q49', link: 'https://new.mta.info/document/6541' },
          { name: 'Q50', link: 'https://new.mta.info/document/88791' },
          { name: 'Q52-SBS', link: 'https://new.mta.info/document/41771' },
          { name: 'Q53-SBS', link: 'https://new.mta.info/document/41771' },
          { name: 'Q54', link: 'https://new.mta.info/document/6561' },
          { name: 'Q55', link: 'https://new.mta.info/document/6566' }
        ]
      },
      {
        header: "Local and Limited Service Q56-Q114",
        routes: [
          { name: 'Q56', link: 'https://new.mta.info/document/6571' },
          { name: 'Q58', link: 'https://new.mta.info/document/6581' },
          { name: 'Q59', link: 'https://new.mta.info/document/6586' },
          { name: 'Q60', link: 'https://new.mta.info/document/6591' },
          { name: 'Q64', link: 'https://new.mta.info/document/6596' },
          { name: 'Q65', link: 'https://new.mta.info/document/6601' },
          { name: 'Q66', link: 'https://new.mta.info/document/6606' },
          { name: 'Q67', link: 'https://new.mta.info/document/10326' },
          { name: 'Q69', link: 'https://new.mta.info/document/10331' },
          { name: 'Q70-SBS', link: 'https://new.mta.info/document/6621' },
          { name: 'Q72', link: 'https://new.mta.info/document/6626' },
          { name: 'Q76', link: 'https://new.mta.info/document/6631' },
          { name: 'Q77', link: 'https://new.mta.info/document/6636' },
          { name: 'Q83', link: 'https://new.mta.info/document/6641' },
          { name: 'Q84', link: 'https://new.mta.info/document/6646' },
          { name: 'Q85', link: 'https://new.mta.info/document/6651' },
          { name: 'Q88', link: 'https://new.mta.info/document/6656' }
        ]
      }
    ],
    "Staten Island": [
      {
        header: "Local Service S40-S79",
        routes: [
          { name: 'S40', link: 'https://new.mta.info/document/7756' },
          { name: 'S42', link: 'https://new.mta.info/document/8641' },
          { name: 'S44', link: 'https://new.mta.info/document/7766' },
          { name: 'S46', link: 'https://new.mta.info/document/7771' },
          { name: 'S48', link: 'https://new.mta.info/document/36101' },
          { name: 'S51', link: 'https://new.mta.info/document/7781' },
          { name: 'S52', link: 'https://new.mta.info/document/8641' },
          { name: 'S53', link: 'https://new.mta.info/document/7791' },
          { name: 'S54', link: 'https://new.mta.info/document/7796' },
          { name: 'S55', link: 'https://new.mta.info/document/7801' },
          { name: 'S56', link: 'https://new.mta.info/document/7806' },
          { name: 'S57', link: 'https://new.mta.info/document/7811' },
          { name: 'S59', link: 'https://new.mta.info/document/7816' },
          { name: 'S61', link: 'https://new.mta.info/document/7821' },
          { name: 'S62', link: 'https://new.mta.info/document/7826' },
          { name: 'S66', link: 'https://new.mta.info/document/7831' },
          { name: 'S74', link: 'https://new.mta.info/document/7836' },
          { name: 'S76', link: 'https://new.mta.info/document/7841' },
          { name: 'S78', link: 'https://new.mta.info/document/7846' },
          { name: 'S79-SBS', link: 'https://new.mta.info/document/7851' }
        ]
      },
      {
        header: "Limited Stop Routes S81-S98",
        routes: [
          { name: 'S81', link: 'https://new.mta.info/document/7781' },
          { name: 'S84', link: 'https://new.mta.info/document/7836' },
          { name: 'S86', link: 'https://new.mta.info/document/7841' },
          { name: 'S89', link: 'https://new.mta.info/document/7716' },
          { name: 'S90', link: 'https://new.mta.info/document/7756' },
          { name: 'S91', link: 'https://new.mta.info/document/7821' },
          { name: 'S92', link: 'https://new.mta.info/document/7826' },
          { name: 'S93', link: 'https://new.mta.info/document/12296' },
          { name: 'S94', link: 'https://new.mta.info/document/7766' },
          { name: 'S96', link: 'https://new.mta.info/document/7771' },
          { name: 'S98', link: 'https://new.mta.info/document/36101' }
        ]
      },
      {
        header: "Express Bus Routes SIM1-SIM35",
        routes: [
          { name: 'SIM1', link: 'https://new.mta.info/document/8551' },
          { name: 'SIM1c', link: 'https://new.mta.info/document/8551' },
          { name: 'SIM2', link: 'https://new.mta.info/document/8571' },
          { name: 'SIM3', link: 'https://new.mta.info/document/14036' },
          { name: 'SIM3c', link: 'https://new.mta.info/document/14036' },
          { name: 'SIM4', link: 'https://new.mta.info/document/8536' },
          { name: 'SIM4c', link: 'https://new.mta.info/document/51906' },
          { name: 'SIM4x', link: 'https://new.mta.info/document/8536' },
          { name: 'SIM5', link: 'https://new.mta.info/document/8616' },
          { name: 'SIM6', link: 'https://new.mta.info/document/8521' },
          { name: 'SIM7', link: 'https://new.mta.info/document/8556' },
          { name: 'SIM8', link: 'https://new.mta.info/document/8576' },
          { name: 'SIM8x', link: 'https://new.mta.info/document/8576' },
          { name: 'SIM9', link: 'https://new.mta.info/document/8606' },
          { name: 'SIM10', link: 'https://new.mta.info/document/8581' },
          { name: 'SIM11', link: 'https://new.mta.info/document/8546' },
          { name: 'SIM15', link: 'https://new.mta.info/document/8526' },
          { name: 'SIM22', link: 'https://new.mta.info/document/8561' },
          { name: 'SIM23', link: 'https://new.mta.info/document/69081' },
          { name: 'SIM24', link: 'https://new.mta.info/document/69086' },
          { name: 'SIM25', link: 'https://new.mta.info/document/8591' },
          { name: 'SIM26', link: 'https://new.mta.info/document/8511' },
          { name: 'SIM30', link: 'https://new.mta.info/document/8541' },
          { name: 'SIM31', link: 'https://new.mta.info/document/8586' },
          { name: 'SIM32', link: 'https://new.mta.info/document/8531' },
          { name: 'SIM33', link: 'https://new.mta.info/document/8566' },
          { name: 'SIM33c', link: 'https://new.mta.info/document/51911' },
          { name: 'SIM34', link: 'https://new.mta.info/document/8596' },
          { name: 'SIM35', link: 'https://new.mta.info/document/8611' }
        ]
      }
    ]
  };
  
  

  
  export default function Schedules(): JSX.Element {
    const [selectedBorough, setSelectedBorough] = useState<Borough | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [highlightedRoute, setHighlightedRoute] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    
    const [dropdownHeight, setDropdownHeight] = useState<Record<Borough, number>>({
      Bronx: 0,
      Brooklyn: 0,
      Queens: 0,
      Manhattan: 0,
      "Staten Island": 0,
    });

  const boroughRefs = useRef<Record<Borough, HTMLDivElement | null>>({
    Bronx: null,
    Brooklyn: null,
    Queens: null,
    Manhattan: null,
    "Staten Island": null,
  });

  const router = useRouter();

  const handleNavigateToHome = () => {
    sessionStorage.setItem("visitedFromSchedules", "true");
    sessionStorage.removeItem("visitedFromSchedules"); // Ensure cleanup
    router.push("/");
  };

  const findRouteBorough = (routeName: string): Borough | null => {
    for (const [borough, groups] of Object.entries(boroughRoutes)) {
      for (const group of groups) {
        if (group.routes.some(route => route.name.toLowerCase() === routeName.toLowerCase())) {
          return borough as Borough;
        }
      }
    }
    return null;
  };

  const getSimilarRoutes = (routeName: string): string[] => {
    const allRoutes: string[] = [];
    Object.values(boroughRoutes).forEach(groups => {
      groups.forEach(group => {
        group.routes.forEach(route => {
          allRoutes.push(route.name);
        });
      });
    });
    
    return allRoutes.filter(route => 
      route.toLowerCase().includes(routeName.toLowerCase()) ||
      routeName.toLowerCase().includes(route.toLowerCase())
    ).slice(0, 5);
  };

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const borough = findRouteBorough(searchQuery);
  
    if (borough) {
      setSelectedBorough(borough);
      setHighlightedRoute(searchQuery);
  
      if (boroughRefs.current[borough]) {
        const scrollHeight = boroughRefs.current[borough]?.scrollHeight || 0;
        setDropdownHeight(prev => ({
          ...prev,
          [borough]: scrollHeight
        }));
  
        // Wait for dropdown to expand
        setTimeout(() => {
          // Wait for the dropdown animation to finish before scrolling to the highlighted element
          const highlightedElement = document.querySelector(`a[href*="${searchQuery.toLowerCase()}"]`);
          if (highlightedElement) {
            highlightedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 400); // 400ms to match the dropdown animation time
      }
  
      setTimeout(() => {
        setHighlightedRoute('');
      }, 2000);
  
      setSuggestions([]);
    } else {
      setSuggestions(getSimilarRoutes(searchQuery));
    }
  };
  
  const handleSearchSuggestion = (route: string) => {
    setSearchQuery(route);
    setSuggestions([]);
    const borough = findRouteBorough(route);
    if (borough) {
      setSelectedBorough(borough);
      setHighlightedRoute(route);
      if (boroughRefs.current[borough]) {
        const scrollHeight = boroughRefs.current[borough]?.scrollHeight || 0;
        setDropdownHeight(prev => ({
          ...prev,
          [borough]: scrollHeight
        }));
  
        // Wait for dropdown to expand
        setTimeout(() => {
          // Wait for the dropdown animation to finish before scrolling to the highlighted element
          const highlightedElement = document.querySelector(`a[href*="${route.toLowerCase()}"]`);
          if (highlightedElement) {
            highlightedElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }, 400); // 400ms to match the dropdown animation time
      }
  
      setTimeout(() => {
        setHighlightedRoute('');
      }, 2000);
    }
  };


  const handleBoroughClick = (borough: Borough): void => {
    setSelectedBorough(prev => prev === borough ? null : borough);
    if (boroughRefs.current[borough]) {
      const scrollHeight = boroughRefs.current[borough]?.scrollHeight || 0;
      setDropdownHeight(prev => ({
        ...prev,
        [borough]: scrollHeight
      }));
    }
  };

  const setRef = (borough: Borough) => (el: HTMLDivElement | null) => {
    boroughRefs.current[borough] = el;
  };

  return (
    <main
      style={{
        padding: "20px",
        maxWidth: "800px",
        margin: "0 auto",
        flex: 1,
      }}
    >
      <p
        style={{
          fontSize: "1.1rem",
          lineHeight: "1.6",
          marginBottom: "1.5rem",
          textAlign: "center",
        }}
      >
        Here you can find an exhaustive list of New York City bus stops provided by the MTA. 
        Simply search for a stop or click on the dropdown for the borough you&apos;re interested in and you will find links to 
        all of the schedule information available from the MTA.
      </p>

      {/* New Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: "1.5rem" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a route (e.g., B62, M15-SBS)"
            style={{
              width: "100%",
              padding: "12px",
              paddingLeft: "40px",
              paddingRight: "100px",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              fontSize: "1rem"
            }}
          />
          <Search style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#9CA3AF"
          }} size={20} />
          <button
            type="submit"
            style={{
              position: "absolute",
              right: "8px",
              top: "50%",
              transform: "translateY(-50%)",
              padding: "6px 16px",
              backgroundColor: "#0078D7",
              color: "white",
              borderRadius: "6px",
              border: "none",
              cursor: "pointer"
            }}
          >
            Search
          </button>
        </div>
      </form>

      {/* Route Suggestions */}
      {suggestions.length > 0 && (
        <div style={{
          marginBottom: "1.5rem",
          padding: "16px",
          backgroundColor: "#f1f1f1",
          borderRadius: "8px"
        }}>
          <p style={{ color: "#4a5568" }}>Did you mean one of these routes?</p>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            marginTop: "8px"
          }}>
            {suggestions.map((route, index) => (
  <button
    key={index}
    onClick={() => {
      setSearchQuery(route);
      setSuggestions([]);
      const borough = findRouteBorough(route);
      if (borough) {
        setSelectedBorough(borough);
        setHighlightedRoute(route);
        if (boroughRefs.current[borough]) {
          const scrollHeight = boroughRefs.current[borough]?.scrollHeight || 0;
          setDropdownHeight(prev => ({
            ...prev,
            [borough]: scrollHeight
          }));
          
          // Wait for dropdown to expand
          setTimeout(() => {
            // Find the highlighted element and scroll to it
            const highlightedElement = document.querySelector(`a[href*="${route.toLowerCase()}"]`);
            if (highlightedElement) {
              highlightedElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
              });
            }
          }, 400); // Wait for dropdown animation
        }
        setTimeout(() => {
          setHighlightedRoute('');
        }, 2000);
      }
    }}
    style={{
      padding: "4px 12px",
      backgroundColor: "white",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      cursor: "pointer"
    }}
  >
    {route}
  </button>
))}
          </div>
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          marginBottom: "2rem",
        }}
      >
        {(Object.keys(boroughRoutes) as Borough[]).map((borough) => (
          <div key={borough} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              onClick={() => handleBoroughClick(borough)}
              style={{
                textDecoration: "none",
                color: "#0078D7",
                fontWeight: "1000",
                fontSize: "1.5rem",
                padding: "10px",
                backgroundColor: "#f1f1f1",
                borderRadius: "8px",
                transition: "background-color 0.2s",
                border: "none",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e6e6e6")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f1f1f1")}
            >
              <span>📍 {borough}</span>
              <span
                style={{
                  transform: selectedBorough === borough ? 'rotate(180deg)' : 'rotate(0)',
                  transition: 'transform 0.3s ease',
                }}
              >
                🔽
              </span>
            </button>

            <div
              ref={setRef(borough)}
              style={{
                maxHeight: selectedBorough === borough ? `${dropdownHeight[borough]}px` : '0px',
                overflow: 'hidden',
                transition: 'max-height 0.4s ease-in-out',
                backgroundColor: '#f9fafb',
                borderRadius: '8px',
              }}
            >
              {boroughRoutes[borough].map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                    padding: "10px",
                  }}
                >
                  <h3 style={{
                    fontSize: "1rem",
                    fontWeight: "600",
                    color: "#4a5568",
                    marginBottom: "4px",
                    paddingLeft: "8px",
                  }}>
                    {group.header}
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
                      gap: "8px",
                      padding: "8px",
                      backgroundColor: "#f8f9fa",
                      borderRadius: "8px",
                    }}
                  >
                    {group.routes.map((route: RouteInfo, routeIndex: number) => (
                      <a
                        key={routeIndex}
                        href={route.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "none",
                          color: "#0078D7",
                          padding: "8px",
                          backgroundColor: highlightedRoute.toLowerCase() === route.name.toLowerCase() 
                            ? "#fff3cd" 
                            : "#ffffff",
                          borderRadius: "4px",
                          textAlign: "center",
                          transition: "all 0.4s",
                          border: "1px solid #e5e7eb",
                          animation: highlightedRoute.toLowerCase() === route.name.toLowerCase() 
                            ? "pulse 10s" 
                            : "none",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = "#f1f1f1";
                          e.currentTarget.style.color = "#005aa3";
                        }}
                        onMouseLeave={(e) => {
                          if (highlightedRoute.toLowerCase() !== route.name.toLowerCase()) {
                            e.currentTarget.style.backgroundColor = "#ffffff";
                          } else {
                            e.currentTarget.style.backgroundColor = "#fff3cd";
                          }
                          e.currentTarget.style.color = "#0078D7";
                        }}
                      >
                        {route.name}
                      </a>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}