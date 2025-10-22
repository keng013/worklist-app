import { useRouter } from "next/router";
import { useCallback } from "react";

export const useWorklistRouter = () => {
  const router = useRouter();
  const { pathname, query, isReady } = router;

  /**
   * ฟังก์ชันสำหรับอัปเดต URL query parameters
   * @param {object} newParams - อ็อบเจกต์ของ query params ที่ต้องการอัปเดต
   */
  const push = useCallback(
    (newParams) => {
      // สร้าง query ใหม่โดยลบค่าที่เป็น null, undefined หรือ empty string
      const cleanedParams = {};
      Object.entries(newParams).forEach(([key, value]) => {
        if (value) {
          // กรองเอาเฉพาะค่าที่มีอยู่จริง
          cleanedParams[key] = value;
        }
      });

      router.push(
        {
          pathname: pathname,
          query: cleanedParams,
        },
        undefined,
        { shallow: true } // shallow: true เพื่อไม่ให้ re-run data fetching (เช่น getServerSideProps)
      );
    },
    [router, pathname]
  );

  /**
   * ฟังก์ชันสำหรับล้าง query parameters ทั้งหมด (Reset)
   */
  const reset = useCallback(() => {
    router.push(
      {
        pathname: pathname,
        query: {}, // ส่ง query ว่าง
      },
      undefined,
      { shallow: true }
    );
  }, [router, pathname]);

  return {
    query, // query ปัจจุบันจาก URL (เช่น { page: '1', patient_id: '123' })
    isReady, // สถานะว่า router พร้อมใช้งานหรือไม่
    push, // ฟังก์ชันสำหรับอัปเดต query
    reset, // ฟังก์ชันสำหรับล้าง query
  };
};
