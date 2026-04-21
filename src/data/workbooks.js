export const workbookGroups = [
  {
    id: 'student-enrollment',
    label: 'Enrollment',
    title: 'Student Enrollment',
    description: 'Historical enrollment workbooks staged for trend analysis.',
    files: [
      {
        year: 2019,
        name: 'student_enrollment_2019.xlsx',
        path: '/data/student_enrollment_2019.xlsx',
        jsonPath: '/data/json/student_enrollment_2019/sheet1.json',
        metadataPath: '/data/json/student_enrollment_2019/metadata.json',
      },
      {
        year: 2020,
        name: 'student_enrollment_2020.xlsx',
        path: '/data/student_enrollment_2020.xlsx',
        jsonPath: '/data/json/student_enrollment_2020/sheet1.json',
        metadataPath: '/data/json/student_enrollment_2020/metadata.json',
      },
      {
        year: 2021,
        name: 'student_enrollment_2021.xlsx',
        path: '/data/student_enrollment_2021.xlsx',
        jsonPath: '/data/json/student_enrollment_2021/sheet1.json',
        metadataPath: '/data/json/student_enrollment_2021/metadata.json',
      },
    ],
  },
  {
    id: 'graduate-employment',
    label: 'Employment',
    title: 'Graduate Employment',
    description: 'Graduate employment workbooks staged for outcome analysis.',
    files: [
      {
        year: 2023,
        name: 'graduate_employment_2023.xlsx',
        path: '/data/graduate_employment_2023.xlsx',
        jsonPath: '/data/json/graduate_employment_2023/sheet1.json',
        metadataPath: '/data/json/graduate_employment_2023/metadata.json',
      },
      {
        year: 2024,
        name: 'graduate_employment_2024.xlsx',
        path: '/data/graduate_employment_2024.xlsx',
        jsonPath: '/data/json/graduate_employment_2024/sheet1.json',
        metadataPath: '/data/json/graduate_employment_2024/metadata.json',
      },
      {
        year: 2025,
        name: 'graduate_employment_2025.xlsx',
        path: '/data/graduate_employment_2025.xlsx',
        jsonPath: '/data/json/graduate_employment_2025/sheet1.json',
        metadataPath: '/data/json/graduate_employment_2025/metadata.json',
      },
    ],
  },
];
