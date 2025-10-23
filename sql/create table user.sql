SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[wkl_users](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[username] [nvarchar](50) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[created_at] [datetime] NULL,
	[role] [varchar](50) NOT NULL,
	[full_name] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY],
UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
ALTER TABLE [dbo].[wkl_users] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[wkl_users] ADD  DEFAULT ('User') FOR [role]
GO
-------------------------------------------------------------

USE [DICOMDB]
GO
/****** Object:  Table [dbo].[wkl_users]    Script Date: 23/10/2025 23:51:37 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[wkl_users](
	[user_id] [int] IDENTITY(1,1) NOT NULL,
	[username] [nvarchar](50) NOT NULL,
	[password_hash] [nvarchar](255) NOT NULL,
	[created_at] [datetime] NULL,
	[role] [varchar](50) NOT NULL,
	[full_name] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[user_id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[wkl_users] ON 
GO
INSERT [dbo].[wkl_users] ([user_id], [username], [password_hash], [created_at], [role], [full_name]) VALUES (1, N'admin', N'$2b$10$s1Elaz9q.d918tfyC3Kq/.h5oA/RYOs0Rsq48CDMqJ7yfH9yQHz6C', CAST(N'2025-10-14T21:27:52.350' AS DateTime), N'Admin', N'MDHC Admin')
GO
INSERT [dbo].[wkl_users] ([user_id], [username], [password_hash], [created_at], [role], [full_name]) VALUES (2, N'it', N'$2b$10$o/EfMftcYuwzyqCrtPfmzeF2fY6DiEmq/VSpSFRqLuoO8WG67V67m', CAST(N'2025-10-14T21:28:06.013' AS DateTime), N'User', N'IT Admin')
GO
INSERT [dbo].[wkl_users] ([user_id], [username], [password_hash], [created_at], [role], [full_name]) VALUES (3, N'keng013', N'$2b$10$jYvYlL7BhpdxhUhh5RvdOe2myU.f4qWsQn1AzTraLbpNLiHqRHaNq', CAST(N'2025-10-22T20:24:19.920' AS DateTime), N'User', N'Kritsada.r')
GO
SET IDENTITY_INSERT [dbo].[wkl_users] OFF
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__wkl_user__F3DBC572A9689F69]    Script Date: 23/10/2025 23:51:37 ******/
ALTER TABLE [dbo].[wkl_users] ADD UNIQUE NONCLUSTERED 
(
	[username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[wkl_users] ADD  DEFAULT (getdate()) FOR [created_at]
GO
ALTER TABLE [dbo].[wkl_users] ADD  DEFAULT ('User') FOR [role]
GO
