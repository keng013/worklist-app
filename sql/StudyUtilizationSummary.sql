CREATE TABLE dbo.StudyUtilizationSummary (
    -- คอลัมน์ที่ใช้ Group By
    ptn_id NVARCHAR(64) NOT NULL,
    ptn_name NVARCHAR(255),
    accession_number NVARCHAR(64) NOT NULL,
    study_desc NVARCHAR(255),
    study_date INT NOT NULL, -- 👈 ใช้ INT YYYYMMDD
    study_time INT,         -- 👈 ใช้ INT HHMMSS
    modality NVARCHAR(16) NOT NULL,
    source_ae NVARCHAR(64) NOT NULL,
    
    -- คอลัมน์ที่ใช้ Aggregate (คำนวณ)
    study_count INT,
    image_count INT,
    total_size_bytes BIGINT,

    -- (Optional) ใช้สำหรับอัปเดตข้อมูล
    last_updated DATETIME DEFAULT GETDATE(), 

    -- สร้าง Primary Key เพื่อให้ตารางเร็วและ Merge ข้อมูลได้
    -- เลือกคอลัมน์ที่ทำให้แต่ละแถว Unique ที่สุด
    CONSTRAINT PK_StudyUtilizationSummary PRIMARY KEY CLUSTERED 
    (
        study_date, accession_number, modality, source_ae, ptn_id
    )
);

-- (Optional but Recommended) สร้าง Index เพิ่มเติมสำหรับ WHERE clause
CREATE NONCLUSTERED INDEX IX_StudyUtilizationSummary_Filter 
ON dbo.StudyUtilizationSummary (study_date, source_ae, modality);

//-------------------------------------------------------------
-- Stored Procedure: sp_UpdateUtilizationSummary
-- คำอธิบาย: อัปเดตหรือเพิ่มข้อมูลในตาราง StudyUtilizationSummary
-- พารามิเตอร์:
--   @StartDate INT - วันที่เริ่มต้นในรูปแบบ YYYYMMDD
--   @EndDate INT - วันที่สิ้นสุดในรูปแบบ YYYYMMDD
-------------------------------------------------------------

CREATE PROCEDURE sp_UpdateUtilizationSummary
    @StartDate INT,
    @EndDate INT
AS
BEGIN
    SET NOCOUNT ON;

    PRINT 'Starting MERGE for StudyUtilizationSummary...';

    -- ใช้ MERGE เพื่ออัปเดตหรือเพิ่มข้อมูล
    MERGE INTO dbo.StudyUtilizationSummary AS T -- T = Target
    USING (
        -- นี่คือ Query ต้นฉบับของคุณ (ส่วน GroupedData)
        -- เราจะกรองเฉพาะวันที่ที่ต้องการประมวลผล
        SELECT
            p.ptn_id,
            p.ptn_name,
            s.accession_number,
            s.study_desc,
            s.study_date, -- 👈 ต้องเป็น INT YYYYMMDD
            s.study_time, -- 👈 ต้องเป็น INT HHMMSS
            se.modality,
            i.source_ae,
            COUNT(DISTINCT s.study_uid_id) as study_count,
            COUNT(i.instance_uid) as image_count,
            SUM(CAST(i.file_size AS BIGINT)) as total_size_bytes 
        FROM patient1 p
        JOIN study1 s ON p.ptn_id_id = s.ptn_id_id
        JOIN series1 se ON s.study_uid_id = se.study_uid_id
        JOIN image1 i ON se.series_uid_id = i.series_uid_id
        -- กรองข้อมูลเฉพาะช่วงวันที่ที่ระบุ
        WHERE s.study_date BETWEEN @StartDate AND @EndDate 
        GROUP BY
            p.ptn_id, p.ptn_name, s.accession_number, s.study_desc, 
            s.study_date, s.study_time, se.modality, i.source_ae
    
    ) AS S -- S = Source
    ON (
        -- ระบุ Key ที่ใช้เชื่อมระหว่าง Target และ Source
        T.study_date = S.study_date AND
        T.accession_number = S.accession_number AND
        T.modality = S.modality AND
        T.source_ae = S.source_ae AND
        T.ptn_id = S.ptn_id
    )

    -- กรณีที่ 1: ข้อมูลตรงกัน (มีอยู่แล้ว) -> ให้อัปเดต
    WHEN MATCHED THEN
        UPDATE SET
            T.ptn_name = S.ptn_name,
            T.study_desc = S.study_desc,
            T.study_time = S.study_time,
            T.study_count = S.study_count,
            T.image_count = S.image_count,
            T.total_size_bytes = S.total_size_bytes,
            T.last_updated = GETDATE()

    -- กรณีที่ 2: ข้อมูลไม่มีใน Target (ของใหม่) -> ให้เพิ่ม
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (
            ptn_id, ptn_name, accession_number, study_desc, study_date, 
            study_time, modality, source_ae, 
            study_count, image_count, total_size_bytes
        )
        VALUES (
            S.ptn_id, S.ptn_name, S.accession_number, S.study_desc, S.study_date, 
            S.study_time, S.modality, S.source_ae, 
            S.study_count, S.image_count, S.total_size_bytes
        );
    
    -- (Optional) กรณีที่ 3: ถ้าต้องการลบข้อมูลสรุปที่ต้นทาง (Source) ไม่มีแล้ว
    -- WHEN NOT MATCHED BY SOURCE AND T.study_date BETWEEN @StartDate AND @EndDate THEN
    --     DELETE;

    PRINT 'MERGE completed.';

END;
GO



/-------------------------------------------------------------`
-- ตัวอย่างการเรียกใช้ Stored Procedure
-- EXEC sp_UpdateUtilizationSummary @StartDate = 20240101, @EndDate = 20240630;
-------------------------------------------------------------/
-- คำนวณวันที่ของเมื่อวาน (รูปแบบ YYYYMMDD) สร้างเป็น schedule job หรือรันด้วยตนเอง

DECLARE @Yesterday INT = CONVERT(INT, CONVERT(VARCHAR(8), GETDATE() - 1, 112));
EXEC sp_UpdateUtilizationSummary @StartDate = @Yesterday, @EndDate = @Yesterday;

-- ลอง Query ดูผลลัพธ์
SELECT TOP 100 * FROM dbo.StudyUtilizationSummary ORDER BY study_date DESC;

//-------------------------------------------------------------
-- สคริปต์สำหรับ Backfill ข้อมูลย้อนหลังเป็นรายเดือน
-------------------------------------------------------------

SET NOCOUNT ON;

PRINT 'Starting Historical Backfill...';

-- 1. 👈 กำหนดวันที่เริ่มต้นที่ต้องการย้อนหลัง (เช่น 1 มกราคม 2020)
DECLARE @LoopDate DATE = '2020-01-01'; 

-- 2. กำหนดวันที่สิ้นสุด (คือ "เมื่อวานนี้")
DECLARE @StopDate DATE = GETDATE() - 1; 

WHILE @LoopDate <= @StopDate
BEGIN
    -- 3. กำหนดวันที่เริ่มต้นของเดือน (INT YYYYMMDD)
    DECLARE @StartDateINT INT = CONVERT(INT, CONVERT(VARCHAR(8), DATEFROMPARTS(YEAR(@LoopDate), MONTH(@LoopDate), 1), 112));
    
    -- 4. กำหนดวันที่สิ้นสุดของเดือน (INT YYYYMMDD)
    DECLARE @EndDateINT INT = CONVERT(INT, CONVERT(VARCHAR(8), EOMONTH(@LoopDate), 112));

    -- 5. ตรวจสอบว่า ถ้ารอบสุดท้าย วันที่สิ้นสุดของเดือน เกิน "เมื่อวาน" หรือไม่
    --    ถ้าเกิน ให้ใช้ "เมื่อวาน" เป็นวันสิ้นสุดแทน
    DECLARE @YesterdayINT INT = CONVERT(INT, CONVERT(VARCHAR(8), @StopDate, 112));
    IF @EndDateINT > @YesterdayINT
    BEGIN
        SET @EndDateINT = @YesterdayINT;
    END

    -- 6. พิมพ์ Log บอกความคืบหน้า (ดูในแท็บ Messages)
    PRINT 'Processing data from ' + CAST(@StartDateINT AS VARCHAR) + ' to ' + CAST(@EndDateINT AS VARCHAR) + '...';

    -- 7. รัน SP เพื่อประมวลผลข้อมูลของเดือนนั้นๆ
    BEGIN TRY
        EXEC dbo.sp_UpdateUtilizationSummary @StartDate = @StartDateINT, @EndDate = @EndDateINT;
        PRINT '...Done.';
    END TRY
    BEGIN CATCH
        -- หากเกิด Error ให้พิมพ์ Error และหยุด Loop
        PRINT '*** ERROR Processing data from ' + CAST(@StartDateINT AS VARCHAR) + ' to ' + CAST(@EndDateINT AS VARCHAR) + ' ***';
        PRINT ERROR_MESSAGE();
        BREAK;
    END CATCH

    -- 8. เลื่อนไปยังเดือนถัดไป
    SET @LoopDate = DATEADD(MONTH, 1, @LoopDate);
END

PRINT 'Historical Backfill Complete.';

//-------------------------------------------------------------
-- แก้ไขสคริปต์ sp_UpdateUtilizationSummary
-- แก้ไข SELECT และ GROUP BY ให้ถูกต้อง
-------------------------------------------------------------
ALTER PROCEDURE sp_UpdateUtilizationSummary
    @StartDate INT,
    @EndDate INT
AS
BEGIN
    SET NOCOUNT ON;

    PRINT 'Starting MERGE for StudyUtilizationSummary...';

    MERGE INTO dbo.StudyUtilizationSummary AS T
    USING (
        -- [FIX] แก้ไข SELECT และ GROUP BY
        SELECT
            p.ptn_id,
            MAX(p.ptn_name) as ptn_name,         -- 👈 [FIX] ใช้ MAX()
            s.accession_number,
            MAX(s.study_desc) as study_desc,     -- 👈 [FIX] ใช้ MAX()
            s.study_date,
            MAX(s.study_time) as study_time,     -- 👈 [FIX] ใช้ MAX()
            se.modality,
            i.source_ae,
            COUNT(DISTINCT s.study_uid_id) as study_count,
            COUNT(i.instance_uid) as image_count,
            SUM(CAST(i.file_size AS BIGINT)) as total_size_bytes 
        FROM patient1 p
        JOIN study1 s ON p.ptn_id_id = s.ptn_id_id
        JOIN series1 se ON s.study_uid_id = se.study_uid_id
        JOIN image1 i ON se.series_uid_id = i.series_uid_id
        WHERE s.study_date BETWEEN @StartDate AND @EndDate 
        
        -- [FIX] GROUP BY เฉพาะคอลัมน์ใน Primary Key
        GROUP BY
            p.ptn_id, 
            s.accession_number, 
            s.study_date, 
            se.modality, 
            i.source_ae
    
    ) AS S
    ON (
        -- ON clause ยังเหมือนเดิม (ตรงกับ PK)
        T.study_date = S.study_date AND
        T.accession_number = S.accession_number AND
        T.modality = S.modality AND
        T.source_ae = S.source_ae AND
        T.ptn_id = S.ptn_id
    )

    -- WHEN MATCHED (ยังเหมือนเดิม)
    WHEN MATCHED THEN
        UPDATE SET
            T.ptn_name = S.ptn_name,
            T.study_desc = S.study_desc,
            T.study_time = S.study_time,
            T.study_count = S.study_count,
            T.image_count = S.image_count,
            T.total_size_bytes = S.total_size_bytes,
            T.last_updated = GETDATE()

    -- WHEN NOT MATCHED (ยังเหมือนเดิม)
    WHEN NOT MATCHED BY TARGET THEN
        INSERT (
            ptn_id, ptn_name, accession_number, study_desc, study_date, 
            study_time, modality, source_ae, 
            study_count, image_count, total_size_bytes
        )
        VALUES (
            S.ptn_id, S.ptn_name, S.accession_number, S.study_desc, S.study_date, 
            S.study_time, S.modality, S.source_ae, 
            S.study_count, S.image_count, S.total_size_bytes
        );
    
    PRINT 'MERGE completed.';

END;
GO
//-------------------------------------------------------------
-- สคริปต์ล้างข้อมูลทั้งหมดในตาราง StudyUtilizationSummary
-------------------------------------------------------------
TRUNCATE TABLE dbo.StudyUtilizationSummary;
-------------------------------------------------------------