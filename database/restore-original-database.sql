USE `u751690829_yhyh111111`;

-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: chrisea_jewelry
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addresses` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `recipient_name` varchar(150) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `address_line_1` varchar(255) NOT NULL,
  `address_line_2` varchar(255) DEFAULT NULL,
  `city` varchar(100) NOT NULL,
  `state` varchar(100) NOT NULL,
  `postcode` varchar(20) NOT NULL,
  `country_code` char(2) NOT NULL DEFAULT 'MY',
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_addresses_user` (`user_id`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;

--
-- Table structure for table `auth_sessions`
--

DROP TABLE IF EXISTS `auth_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auth_sessions` (
  `id` char(36) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `refresh_token_hash` char(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `refresh_token_hash` (`refresh_token_hash`),
  KEY `idx_auth_sessions_user_expiry` (`user_id`,`expires_at`),
  CONSTRAINT `fk_auth_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_sessions`
--

/*!40000 ALTER TABLE `auth_sessions` DISABLE KEYS */;
INSERT INTO `auth_sessions` VALUES ('080352c3-5895-4877-84d8-d36a6c0a3bbb',2,'1faec4397bf348aeb3956572e05b6352a33cb48dafffc4dd4c9b4e03929cdc51','2026-11-12 06:53:54','2026-10-13 07:05:02','2026-10-13 14:53:54'),('08a05384-873b-4683-bea6-a3fd7dacca0b',2,'be9554b1a770e04c6622107e1d1b362729a5834034df8528aed462b528b1b592','2026-11-12 07:14:58',NULL,'2026-10-13 15:14:58'),('0d6c3de0-4baf-4131-af85-368667e0054b',2,'b3ccb23a9954aebbed3eb95ce5decb3f912e9f4124db4bd4ba5efdb880f5265c','2026-11-15 09:55:39',NULL,'2026-10-16 17:55:40'),('0f0b64bb-541d-4b6f-aaa5-c1a7e95e3b05',2,'4a1da099ba47d90d4570156453bdd67e38bf0f1d23d5ad2d1d92d40f680c1b17','2026-11-15 04:57:56','2026-10-16 13:10:21','2026-10-16 12:57:56'),('13e5b074-6e46-42ee-8dae-7b929756169e',1,'726f3dedd002616dd4df63096cf785e31846fbb87f3a899ad1dc8bd2e5890039','2026-11-12 06:42:21',NULL,'2026-10-13 14:42:21'),('230bf8c2-cada-48db-9928-51f1dc782224',2,'dd89d3e6c958c332dccf6f427dc44282d6f6b5995ed96b9b61bc5f468c5363af','2026-11-12 07:34:04',NULL,'2026-10-13 15:34:04'),('28fec34f-9455-4f5b-945b-b7736fb17c27',2,'bb55c9bc94f9987df07433bea06f9c3aa383846cd38b0efc5c8d8b26485a2c2b','2026-11-12 07:07:22',NULL,'2026-10-13 15:07:22'),('2e50bbc0-dbf9-4571-977b-85575938939c',2,'26a8973b2806d25ba941416d46635bbfd153e89c184f12b6d7c2c0a1d21dfafa','2026-11-15 13:19:13','2026-10-16 13:19:46','2026-10-16 21:19:13'),('2ed7121a-acc2-4087-8de9-4754e7ed15e8',2,'fb64722123a605a61338dbca037a4b0b1df8f7dde1294a9b1e36402a22f7d25f','2026-11-12 06:48:07',NULL,'2026-10-13 14:48:07'),('3ef37b54-bbdd-40e8-a442-4e8236102d71',2,'038ec22bafa113e538b6547029c328d25c2cc8110360221151f590b16bc82a03','2026-11-14 13:28:29',NULL,'2026-10-15 21:28:29'),('4bfcd2ba-cfcf-447c-93bf-7e42a5e7ad54',2,'e4ab511381e7c999853bdb9443a8fbfca4462d6b0a22645e7772867f5b524bbf','2026-11-12 07:19:41',NULL,'2026-10-13 15:19:41'),('57228ea9-7468-46db-a85b-049bb0fa7c34',2,'a771f9699bdb3e68406cf67e7421193b3db7436358ec1511a0c833c0e6df3599','2026-11-15 13:20:02','2026-10-16 13:51:07','2026-10-16 21:20:02'),('592b4437-3f32-4026-8de6-9d3f6347eef1',2,'afd2b72af7824e72338b03bd315261242eb3e9c01aa4520664ae12642a905595','2026-11-15 13:10:21','2026-10-16 13:11:47','2026-10-16 21:10:21'),('5c126a5c-8542-48ff-af07-50382f5d13b4',2,'ea10394375866bbc357e8e9f8dea9a3837c41abaaefa329ad136477bf0215ad6','2026-11-12 22:35:33',NULL,'2026-10-14 06:35:33'),('5d70fb55-3f18-4270-8e45-975f686182cf',2,'b4d2998dd47cacaf9420da4aed4dd2cca49c41d7b601ad14745e6a7a5c637da7','2026-11-15 04:54:37',NULL,'2026-10-16 12:54:37'),('616eff58-b0ec-42bb-b47b-2e6b6fda2861',2,'476730ec8cf966fe03b404491f8ab1bf852fa8fda47a95c1ed12bd3e3d5803b8','2026-11-14 13:30:35',NULL,'2026-10-15 21:30:35'),('64522a0d-4d6c-4d9a-8559-d4931a06e727',2,'c08fe9266d146b0162b25161cc0cc6c137d1aa905a2d99e7b08fe16e389a52a8','2026-11-15 15:22:00',NULL,'2026-10-16 23:22:00'),('678df354-658c-4fbd-a743-41aa5b452e97',2,'95dea2d0da94b6f71bfa0ca4f8dd8e5fd84011dba6cee05e7553e4e7940e3110','2026-11-15 13:11:47','2026-10-16 13:15:32','2026-10-16 21:11:47'),('69630915-437c-452c-aa85-ef6809c6bce7',2,'2850c51f99c000835091fcc027e9f23b40409a9cbdb295c310a95e4e3c788ddc','2026-11-15 13:16:06','2026-10-16 13:16:21','2026-10-16 21:16:06'),('6d20bed3-6564-4910-9f1c-4db93aba85cd',2,'caaf3c8472b9101f12dd811a3b754a4c774143f3d424584c5358893692477129','2026-11-15 13:16:21','2026-10-16 13:19:07','2026-10-16 21:16:21'),('737986ed-8b22-4b8e-b5a8-b9f5498aaa99',2,'6a3aad919bcbef1a43a755c4ca5b8f379a51192834dbe2d2eeac221066d3428a','2026-11-14 12:50:16',NULL,'2026-10-15 20:50:16'),('8c382b47-be25-42af-a0b4-e5e006e1a6f2',2,'ce3cdb1983faf1d84817f6ba71bce56fdbb3cf6d78c077a939f3623d4b46ce43','2026-11-15 13:19:46','2026-10-16 13:20:02','2026-10-16 21:19:46'),('a6060379-95e3-42c7-ac85-b03bb6b1b597',2,'7db9f80ca4a2b32828272e40149bc662cd8e0a8154e5d8c0708ec18eeeb3f4de','2026-11-14 13:27:49',NULL,'2026-10-15 21:27:49'),('a949f231-1141-4f85-a8cf-07bd9cfe43b0',2,'2d1e8fef6b0be1eef88cbc2ec6a991c7603e65c2f8ab06490bd015a3d10142c4','2026-11-12 22:53:57',NULL,'2026-10-14 06:53:57'),('c4faa7fb-068d-41fd-887b-c3cfa4deb665',2,'396445106c55f13eb1a3b6fe17088bc57bb3651b1800dfa41bc7ba19a6e3451b','2026-11-12 07:32:06',NULL,'2026-10-13 15:32:06'),('cdfdd958-c9b4-480b-8f77-6ace9e62089a',2,'c9cb26b6ac213d63c944c92679d0cbdebd6d1c33697a8a78eea2302300d2faae','2026-11-15 13:19:07','2026-10-16 13:19:13','2026-10-16 21:19:07'),('dcad2e91-30bd-47db-9d66-4284e076a6f5',1,'6f3003e2602d39249918c97134ec7c3aba0cfe60d537e92da6253505187e7f0c','2026-11-12 06:42:00',NULL,'2026-10-13 14:42:00'),('e4cb18cd-c917-4fda-b1da-5e18a447484d',2,'7cf0692e8367d3bf36d0484305ecba19d29864cea8dc9e5fde35415190019f6c','2026-11-15 13:15:32','2026-10-16 13:16:06','2026-10-16 21:15:32'),('ead589d9-5344-42b9-a883-40c4b608797d',2,'6a82c023b05e6a345345fb162b962e85e8f3341e866713371d70e22e680078b6','2026-11-12 07:06:40',NULL,'2026-10-13 15:06:40'),('ed8ef418-7fe7-4ab4-9faa-8a6c6c66dc76',2,'5d704b0c989d496d7247fd5b59f2191cffc705650563e1a5efaf2dc936fe5d7e','2026-11-15 13:51:07','2026-10-16 15:22:00','2026-10-16 21:51:07'),('fc9621dc-4210-4ee9-8b39-a2cda541f7a9',2,'b3e4ad2669ebfeb753ade36a4afdad668cd8595a825cb0839498442c0baff8b7','2026-11-12 07:11:51',NULL,'2026-10-13 15:11:51'),('fddce518-004e-4b22-83a8-45a72c84fbca',2,'7e9b319fca860998a0e9bb89220e545b88a96bd27e63a8f22b8855a9384dfacd','2026-11-12 07:11:25',NULL,'2026-10-13 15:11:25');
/*!40000 ALTER TABLE `auth_sessions` ENABLE KEYS */;

--
-- Table structure for table `blog_posts`
--

DROP TABLE IF EXISTS `blog_posts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `blog_posts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `author_id` bigint(20) unsigned DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `excerpt` varchar(500) DEFAULT NULL,
  `content` longtext NOT NULL,
  `featured_image_url` varchar(1000) DEFAULT NULL,
  `status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
  `published_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `fk_blog_author` (`author_id`),
  KEY `idx_blog_status_published` (`status`,`published_at`),
  CONSTRAINT `fk_blog_author` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blog_posts`
--

/*!40000 ALTER TABLE `blog_posts` DISABLE KEYS */;
/*!40000 ALTER TABLE `blog_posts` ENABLE KEYS */;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cart_id` bigint(20) unsigned NOT NULL,
  `variant_id` bigint(20) unsigned NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_variant` (`cart_id`,`variant_id`),
  KEY `fk_cart_items_variant` (`variant_id`),
  CONSTRAINT `fk_cart_items_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cart_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`),
  CONSTRAINT `chk_cart_quantity` CHECK (`quantity` > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carts` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_carts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Necklaces','necklaces',NULL,1,1,'2026-10-13 14:30:59','2026-10-13 14:30:59'),(2,'Bracelets','bracelets',NULL,1,2,'2026-10-13 14:30:59','2026-10-13 14:30:59'),(3,'Rings','rings',NULL,1,3,'2026-10-13 14:30:59','2026-10-13 14:30:59'),(4,'Earrings','earrings',NULL,1,4,'2026-10-13 14:30:59','2026-10-13 14:30:59'),(5,'pemda','pemda',NULL,0,5,'2026-10-14 06:59:31','2026-10-14 07:02:35');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;

--
-- Table structure for table `inventory_movements`
--

DROP TABLE IF EXISTS `inventory_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `inventory_movements` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `variant_id` bigint(20) unsigned NOT NULL,
  `quantity_change` int(11) NOT NULL,
  `reason` enum('purchase','restock','adjustment','cancellation','return') NOT NULL,
  `reference` varchar(100) DEFAULT NULL,
  `created_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_inventory_variant` (`variant_id`),
  KEY `fk_inventory_user` (`created_by`),
  CONSTRAINT `fk_inventory_user` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inventory_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_movements`
--

/*!40000 ALTER TABLE `inventory_movements` DISABLE KEYS */;
INSERT INTO `inventory_movements` VALUES (1,16,-1,'purchase','CHR-1935394099-17',NULL,'2026-10-14 07:49:54'),(2,16,-3,'purchase','CHR-1979684682-30',NULL,'2026-10-14 20:08:04'),(3,16,-1,'adjustment','Admin product list',2,'2026-10-14 20:19:31'),(4,14,-1,'adjustment','Admin product list',2,'2026-10-14 20:19:35'),(5,14,1,'adjustment','Admin product list',2,'2026-10-14 20:19:37'),(6,16,1,'adjustment','Admin product list',2,'2026-10-14 20:19:39'),(7,16,1,'cancellation','CHR-1935394099-17',2,'2026-10-14 21:11:24'),(8,16,-1,'purchase','CHR-1935394099-17',2,'2026-10-14 21:11:25'),(9,16,1,'cancellation','CHR-1935394099-17',2,'2026-10-16 12:32:39'),(10,16,-3,'purchase','CHR-1979684682-30',2,'2026-10-16 13:07:05'),(11,16,3,'cancellation','CHR-1979684682-30',2,'2026-10-16 13:07:07');
/*!40000 ALTER TABLE `inventory_movements` ENABLE KEYS */;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `variant_id` bigint(20) unsigned DEFAULT NULL,
  `product_name` varchar(180) NOT NULL,
  `variant_name` varchar(150) NOT NULL,
  `sku` varchar(100) NOT NULL,
  `unit_price` decimal(12,2) NOT NULL,
  `quantity` int(10) unsigned NOT NULL,
  `line_total` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_order_items_order` (`order_id`),
  KEY `fk_order_items_variant` (`variant_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chk_order_item_values` CHECK (`unit_price` >= 0 and `quantity` > 0 and `line_total` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_status_history` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `from_status` varchar(40) DEFAULT NULL,
  `to_status` varchar(40) NOT NULL,
  `note` varchar(1000) DEFAULT NULL,
  `changed_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_history_order` (`order_id`),
  KEY `fk_history_user` (`changed_by`),
  CONSTRAINT `fk_history_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_history_user` FOREIGN KEY (`changed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(30) NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `promotion_id` bigint(20) unsigned DEFAULT NULL,
  `status` enum('pending_payment','pending_verification','payment_confirmed','payment_rejected','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
  `payment_method` enum('bank_transfer','tng_qr') NOT NULL,
  `currency` char(3) NOT NULL DEFAULT 'MYR',
  `subtotal` decimal(12,2) NOT NULL,
  `discount_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `shipping_total` decimal(12,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(12,2) NOT NULL,
  `recipient_name` varchar(150) NOT NULL,
  `recipient_phone` varchar(30) NOT NULL,
  `shipping_address_line_1` varchar(255) NOT NULL,
  `shipping_address_line_2` varchar(255) DEFAULT NULL,
  `shipping_city` varchar(100) NOT NULL,
  `shipping_state` varchar(100) NOT NULL,
  `shipping_postcode` varchar(20) NOT NULL,
  `shipping_country_code` char(2) NOT NULL DEFAULT 'MY',
  `customer_note` varchar(1000) DEFAULT NULL,
  `tracking_number` varchar(150) DEFAULT NULL,
  `placed_at` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`),
  KEY `fk_orders_promotion` (`promotion_id`),
  KEY `idx_orders_user_created` (`user_id`,`created_at`),
  KEY `idx_orders_status_created` (`status`,`created_at`),
  CONSTRAINT `fk_orders_promotion` FOREIGN KEY (`promotion_id`) REFERENCES `promotions` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_order_totals` CHECK (`subtotal` >= 0 and `discount_total` >= 0 and `shipping_total` >= 0 and `grand_total` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;

--
-- Table structure for table `payment_proofs`
--

DROP TABLE IF EXISTS `payment_proofs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_proofs` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` bigint(20) unsigned NOT NULL,
  `storage_key` varchar(500) NOT NULL,
  `original_filename` varchar(255) NOT NULL,
  `mime_type` varchar(100) NOT NULL,
  `file_size_bytes` bigint(20) unsigned NOT NULL,
  `payment_reference` varchar(150) DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint(20) unsigned DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `review_note` varchar(1000) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_proofs_reviewer` (`reviewed_by`),
  KEY `idx_payment_proofs_order_status` (`order_id`,`status`),
  CONSTRAINT `fk_proofs_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_proofs_reviewer` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_proofs`
--

/*!40000 ALTER TABLE `payment_proofs` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_proofs` ENABLE KEYS */;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_images` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `image_url` varchar(1000) NOT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_images_product` (`product_id`),
  CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=133 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (42,12,'/assets/products/statement-pearl-earrings/01-vintage-gold.png','S925 Sterling Silver Statement Natural Pearl Earrings view 1',1,1,'2026-10-14 07:01:57'),(43,12,'/assets/products/statement-pearl-earrings/02-styled.png','S925 Sterling Silver Statement Natural Pearl Earrings view 2',2,0,'2026-10-14 07:01:57'),(44,12,'/assets/products/statement-pearl-earrings/03-both-colours.png','S925 Sterling Silver Statement Natural Pearl Earrings view 3',3,0,'2026-10-14 07:01:57'),(47,10,'/assets/products/mother-of-pearl-heart-earrings/01-vintage-gold.png','S925 Sterling Silver Vintage Natural Mother-of-Pearl Heart Earrings view 1',1,1,'2026-10-14 07:02:08'),(48,10,'/assets/products/mother-of-pearl-heart-earrings/02-both-colours.png','S925 Sterling Silver Vintage Natural Mother-of-Pearl Heart Earrings view 2',2,0,'2026-10-14 07:02:08'),(49,9,'/assets/products/four-leaf-zircon-ring/03-main.png','S925 Sterling Silver Zircon Ring view 1',1,1,'2026-10-14 07:02:13'),(50,9,'/assets/products/four-leaf-zircon-ring/04-styled.png','S925 Sterling Silver Zircon Ring view 2',2,0,'2026-10-14 07:02:13'),(51,9,'/assets/products/four-leaf-zircon-ring/01-lifestyle.png','S925 Sterling Silver Zircon Ring view 3',3,0,'2026-10-14 07:02:13'),(52,9,'/assets/products/four-leaf-zircon-ring/02-lifestyle.png','S925 Sterling Silver Zircon Ring view 4',4,0,'2026-10-14 07:02:13'),(56,8,'/assets/products/lapis-mother-of-pearl-ring/01-vintage-gold.png','S925 Sterling Silver Vintage Zircon Lapis Lazuli / Mother-of-Pearl Ring view 1',1,1,'2026-10-14 07:03:54'),(57,8,'/assets/products/lapis-mother-of-pearl-ring/02-both-colours.png','S925 Sterling Silver Vintage Zircon Lapis Lazuli / Mother-of-Pearl Ring view 2',2,0,'2026-10-14 07:03:54'),(58,8,'/assets/products/lapis-mother-of-pearl-ring/03-both-colours.png','S925 Sterling Silver Vintage Zircon Lapis Lazuli / Mother-of-Pearl Ring view 3',3,0,'2026-10-14 07:03:54'),(59,7,'/assets/products/gilded-bow-ring/04-main.png','Gilded Bow Ring view 1',1,1,'2026-10-14 07:06:54'),(60,7,'/assets/products/gilded-bow-ring/01-lifestyle.png','Gilded Bow Ring view 2',2,0,'2026-10-14 07:06:54'),(61,7,'/assets/products/gilded-bow-ring/02-lifestyle.png','Gilded Bow Ring view 3',3,0,'2026-10-14 07:06:54'),(62,7,'/assets/products/gilded-bow-ring/03-lifestyle.png','Gilded Bow Ring view 4',4,0,'2026-10-14 07:06:54'),(63,6,'/assets/products/statement-zircon-ring/01-main.png','S925 Sterling Silver Statement Zircon Ring view 1',1,1,'2026-10-14 07:06:59'),(64,6,'/assets/products/statement-zircon-ring/02-styled.png','S925 Sterling Silver Statement Zircon Ring view 2',2,0,'2026-10-14 07:06:59'),(69,4,'/assets/products/pearl-turquoise-bracelet/01-main.png','Pearl & Turquoise Gemstone Bracelet view 1',1,1,'2026-10-14 07:07:08'),(70,4,'/assets/products/pearl-turquoise-bracelet/02-detail.png','Pearl & Turquoise Gemstone Bracelet view 2',2,0,'2026-10-14 07:07:08'),(71,4,'/assets/products/pearl-turquoise-bracelet/03-lifestyle.png','Pearl & Turquoise Gemstone Bracelet view 3',3,0,'2026-10-14 07:07:08'),(72,3,'/assets/products/minimalist-pearl-bracelet/01-main.png','S925 Sterling Silver Minimalist Pearl Bracelet view 1',1,1,'2026-10-14 07:07:11'),(73,3,'/assets/products/minimalist-pearl-bracelet/02-lifestyle.png','S925 Sterling Silver Minimalist Pearl Bracelet view 2',2,0,'2026-10-14 07:07:11'),(74,3,'/assets/products/minimalist-pearl-bracelet/03-lifestyle.png','S925 Sterling Silver Minimalist Pearl Bracelet view 3',3,0,'2026-10-14 07:07:11'),(75,3,'/assets/products/minimalist-pearl-bracelet/04-lifestyle.png','S925 Sterling Silver Minimalist Pearl Bracelet view 4',4,0,'2026-10-14 07:07:11'),(76,2,'/assets/products/zircon-heart-necklace/02-main.png','S925 Sterling Silver Vintage Zircon Heart Pendant Necklace view 1',1,1,'2026-10-14 07:07:16'),(77,2,'/assets/products/zircon-heart-necklace/01-detail.png','S925 Sterling Silver Vintage Zircon Heart Pendant Necklace view 2',2,0,'2026-10-14 07:07:16'),(80,11,'/assets/products/zircon-button-earrings/01-main.png','Zircon Button Earrings view 1',1,1,'2026-10-14 07:10:41'),(81,11,'/assets/products/zircon-button-earrings/02-styled.png','Zircon Button Earrings view 2',2,0,'2026-10-14 07:10:41'),(86,1,'/assets/products/enamel-coin-necklace/01-main.png','925 Sterling Silver Enamel Pendant Necklace view 1',1,1,'2026-10-14 07:11:06'),(87,1,'/assets/products/enamel-coin-necklace/02-detail.png','925 Sterling Silver Enamel Pendant Necklace view 2',2,0,'2026-10-14 07:11:06'),(114,5,'/assets/products/malachite-pearl-bracelet/01-main.png','Vintage Gold Malachite & Pearl Bracelet view 1',1,1,'2026-10-16 13:12:09'),(115,5,'/assets/products/malachite-pearl-bracelet/02-full-view.png','Vintage Gold Malachite & Pearl Bracelet view 2',2,0,'2026-10-16 13:12:09'),(116,5,'/assets/products/malachite-pearl-bracelet/03-lifestyle.png','Vintage Gold Malachite & Pearl Bracelet view 3',3,0,'2026-10-16 13:12:09'),(117,5,'/assets/products/malachite-pearl-bracelet/04-lifestyle.png','Vintage Gold Malachite & Pearl Bracelet view 4',4,0,'2026-10-16 13:12:09'),(130,13,'/assets/products/statement-heart-zircon-earrings/01-vintage-gold.png','S925 Sterling Silver Statement Heart Zircon Earrings view 1',1,1,'2026-10-16 20:27:07'),(131,13,'/assets/products/statement-heart-zircon-earrings/02-styled.png','S925 Sterling Silver Statement Heart Zircon Earrings view 2',2,0,'2026-10-16 20:27:07'),(132,13,'/assets/products/statement-heart-zircon-earrings/03-both-colours.png','S925 Sterling Silver Statement Heart Zircon Earrings view 3',3,0,'2026-10-16 20:27:07');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_variants` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `sku` varchar(100) NOT NULL,
  `variant_name` varchar(150) NOT NULL,
  `price` decimal(12,2) NOT NULL,
  `stock_quantity` int(10) unsigned NOT NULL DEFAULT 0,
  `low_stock_threshold` int(10) unsigned NOT NULL DEFAULT 5,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `sku` (`sku`),
  KEY `idx_variants_product_active` (`product_id`,`is_active`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_variants_price` CHECK (`price` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (1,1,'CHR-NKL-001','Default',168.00,15,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(2,2,'CHR-NKL-002','Default',155.00,8,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(3,3,'CHR-BRC-001','Default',189.00,14,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(4,4,'CHR-BRC-002','Default',139.00,3,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(5,5,'CHR-BRC-003','Default',0.00,9,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(6,6,'CHR-RNG-001','Default',120.00,7,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(7,7,'CHR-RNG-002','Default',128.00,2,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(8,8,'CHR-RNG-003-GD','Default',138.00,5,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(9,8,'CHR-RNG-003-PT','Platinum / Mother-of-Pearl / Pre-order',138.00,0,5,0,'2026-10-13 14:30:59','2026-10-16 13:09:28'),(10,9,'CHR-RNG-004','Default',138.00,11,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(11,10,'CHR-ERG-001-GD','Default',152.00,8,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(12,10,'CHR-ERG-001-PT','Platinum / Pre-order',152.00,0,5,0,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(13,11,'CHR-ERG-002','Default',128.00,20,5,1,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(14,12,'CHR-ERG-003-GD','Default',135.00,13,5,1,'2026-10-13 14:30:59','2026-10-14 20:19:37'),(15,12,'CHR-ERG-003-PT','Platinum / Pre-order',135.00,0,5,0,'2026-10-13 14:30:59','2026-10-14 07:26:16'),(16,13,'CHR-ERG-004-GD','Default',120.00,10,5,1,'2026-10-13 14:30:59','2026-10-16 20:27:07'),(17,13,'CHR-ERG-004-PT','Platinum / Pre-order',120.00,0,5,0,'2026-10-13 14:30:59','2026-10-14 07:26:16');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint(20) unsigned NOT NULL,
  `name` varchar(180) NOT NULL,
  `slug` varchar(200) NOT NULL,
  `short_description` varchar(500) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `material` varchar(255) DEFAULT NULL,
  `color` varchar(150) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  `base_price` decimal(12,2) NOT NULL,
  `discount_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
  `featured` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_products_category_status` (`category_id`,`status`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
  CONSTRAINT `chk_products_price` CHECK (`base_price` >= 0)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,'925 Sterling Silver Enamel Pendant Necklace','925-sterling-silver-enamel-pendant-necklace','A vintage-gold necklace with a red enamel Chinese coin-inspired pendant.','Inspired by the timeless beauty of traditional Chinese design, this necklace features a classic Chinese coin motif paired with delicate pearl-like rings in a regal, court-inspired style. The rich red enamel adds a touch of vintage elegance while symbolising good fortune, prosperity and auspicious blessings.\n\nMaterial: S925 Sterling Silver / Enamel\nColour: Vintage Gold\nChain Length: Approx. 40 cm + 6 cm extender\nPendant Height: Approx. 1.5 cm','S925 Sterling Silver / Enamel','Vintage Gold',NULL,168.00,0.00,'active',1,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(2,1,'S925 Sterling Silver Vintage Zircon Heart Pendant Necklace','s925-sterling-silver-vintage-zircon-heart-pendant-necklace','A petite vintage-gold heart pendant accented with colourful zircon details.','A delicate vintage-inspired necklace featuring a sculpted heart pendant accented with colourful zircon details. Its warm vintage-gold finish and petite proportions make it an elegant piece for everyday wear or thoughtful gifting.\n\nMaterial: S925 Sterling Silver / Zircon\nColour: Vintage Gold\nChain Length: Approx. 39 cm + 6 cm extender\nPendant Size: Approx. 1.3 cm','S925 Sterling Silver / Zircon','Vintage Gold',NULL,155.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(3,2,'S925 Sterling Silver Minimalist Pearl Bracelet','s925-sterling-silver-minimalist-pearl-bracelet','A minimalist double-strand natural pearl bracelet with a flowing vintage-gold accent.','A graceful minimalist bracelet combining two delicate strands of natural pearls with a fluid vintage-gold accent. The adjustable extender offers a comfortable fit, while the organic character of each pearl makes every piece subtly unique.\n\nMaterial: S925 Sterling Silver / Natural Pearl\nColour: Vintage Gold\nBracelet Length: Approx. 16 cm + 3 cm extender\nPearl Size: Approx. 4 mm','S925 Sterling Silver / Natural Pearl','Vintage Gold',NULL,189.00,0.00,'active',1,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(4,2,'Pearl & Turquoise Gemstone Bracelet','pearl-turquoise-gemstone-bracelet','A French vintage-inspired pearl bracelet centred with a blue synthetic turquoise accent.','Vintage 37-bead pearls are beautifully paired with a delicate blue turquoise accent at the centre, creating an elegant French vintage charm reminiscent of the timeless glamour of the Breakfast at TiffanyÔÇÖs era.\n\nMaterial: S925 Sterling Silver / Synthetic Turquoise / Natural Pearls\nColour: Vintage Gold\nBracelet Length: Approx. 16 cm + 3 cm extender\nPearl Size: Approx. 4ÔÇô5 mm\nTurquoise Size: Approx. 5 mm','S925 Sterling Silver / Synthetic Turquoise / Natural Pearls','Vintage Gold',NULL,139.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(5,2,'Vintage Gold Malachite & Pearl Bracelet','vintage-gold-malachite-pearl-bracelet','An adjustable natural pearl bracelet with a malachite charm and symbolic Fu-inspired detail.','A delicate arrangement of pearls creates an effortless, elegant look, complemented by a fluid gold-tone setting featuring a traditional ÔÇ£FuÔÇØ character design. Symbolising blessings, happiness and good fortune, this bracelet lets you carry beautiful wishes with you wherever you go.\n\nPrice: TO BE CONFIRMED','S925 Sterling Silver / Malachite / Natural Pearls','Vintage Gold','Approx. 16 cm + 3 cm extender',0.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-16 13:12:09'),(6,3,'S925 Sterling Silver Statement Zircon Ring','s925-sterling-silver-statement-zircon-ring','A bold vintage-gold linked ring with refined zircon accents.','A bold vintage-gold statement ring crafted in S925 sterling silver. Its sculptural linked design is illuminated with zircon accents, balancing distinctive character with refined shine. The open construction allows for an adjustable fit.\n\nMaterial: S925 Sterling Silver / Zircon\nColour: Vintage Gold\nSize: Adjustable open ring, approx. US size 16 (size system to be confirmed)','S925 Sterling Silver / Zircon','Vintage Gold',NULL,120.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(7,3,'Gilded Bow Ring','gilded-bow-ring','A delicately textured vintage-gold bow ring with an elegant zircon detail.','The delicate textured finish adds an effortlessly vintage touch, while the delicate teardrop zircon detail captures a sense of graceful, sophisticated elegance.\n\nMaterial: S925 Sterling Silver\nColour: Vintage Gold\nSize: Adjustable open ring, approx. US size 16 (size system to be confirmed)','S925 Sterling Silver','Vintage Gold',NULL,128.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(8,3,'S925 Sterling Silver Vintage Zircon Lapis Lazuli / Mother-of-Pearl Ring','s925-sterling-silver-vintage-zircon-lapis-lazuli-mother-of-pearl-ring','A vintage open ring offered with lapis lazuli or mother-of-pearl.','A romantic vintage-inspired open ring accented with sparkling zircon and a sculptural centre stone. Choose deep-blue lapis lazuli in warm Vintage Gold or luminous mother-of-pearl in cool Platinum. The intricate woven band brings delicate texture and timeless character to either finish.\n\nMaterial: S925 Sterling Silver / Zircon / Lapis Lazuli / Mother-of-Pearl\nColours: Vintage Gold / Platinum\nSize: Adjustable open ring, approx. US size 14 (size system to be confirmed)\nNote: Platinum is available by pre-order only.','S925 Sterling Silver / Zircon / Lapis Lazuli / Mother-of-Pearl',NULL,NULL,138.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(9,3,'S925 Sterling Silver Zircon Ring','s925-sterling-silver-zircon-ring','A regal four-leaf clover ring with beaded details and a central cubic zirconia.','A regal four-leaf clover design framed with delicate beaded detailing, gracefully surrounding the central zircon stone. The intricate setting exudes an elegant, luxurious feel reminiscent of fine jewellery.\n\nMaterial: S925 Sterling Silver / Cubic Zirconia\nColour: Vintage Gold\nSize: Adjustable open ring, approx. US size 14 (size system to be confirmed)','S925 Sterling Silver / Cubic Zirconia','Vintage Gold',NULL,138.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(10,4,'S925 Sterling Silver Vintage Natural Mother-of-Pearl Heart Earrings','s925-sterling-silver-vintage-natural-mother-of-pearl-heart-earrings','Romantic vintage heart earrings with luminous natural mother-of-pearl.','A delicate heart in motion, evoking the feeling of longing and affection. The soft, lustrous mother-of-pearl symbolises the purity and devotion of love, while the vintage-inspired design adds a timeless and romantic touch.\n\nMaterial: S925 Sterling Silver / Natural Mother-of-Pearl\nColours: Vintage Gold / Platinum\nSize: Approx. 2 cm in height\nNote: Platinum is available by pre-order only.','S925 Sterling Silver / Natural Mother-of-Pearl',NULL,NULL,152.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(11,4,'Zircon Button Earrings','zircon-button-earrings','Round vintage-gold button earrings accented with sparkling zircon.','The round button design symbolises wholeness and smoothness in life, while the sparkling zircon accents represent a life filled with brightness and brilliance. Wear them as a little reminder to embrace joy, completeness and good fortune wherever you go.\n\nMaterial: S925 Sterling Silver\nColour: Vintage Gold\nSize: Approx. 1.6 cm','S925 Sterling Silver','Vintage Gold',NULL,128.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(12,4,'S925 Sterling Silver Statement Natural Pearl Earrings','s925-sterling-silver-statement-natural-pearl-earrings','Natural pearl earrings framed by ornate vintage-inspired detailing.','Natural pearls sit at the centre of ornate, vintage-inspired frames, creating a confident statement with refined detail. Available in warm Vintage Gold or cool Platinum, these earrings bring timeless character to both everyday and occasion styling.\n\nMaterial: S925 Sterling Silver / Natural Pearl\nColours: Vintage Gold / Platinum\nSize: Approx. 1.5 cm\nPearl Size: Approx. 7 mm\nNote: Platinum is available by pre-order only.','S925 Sterling Silver / Natural Pearl',NULL,NULL,135.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-14 07:35:36'),(13,4,'S925 Sterling Silver Statement Heart Zircon Earrings','s925-sterling-silver-statement-heart-zircon-earrings','Sculptural heart earrings intertwined with sparkling cubic zirconia.','Sculptural heart silhouettes intertwine with sparkling cubic zirconia to create a compact yet expressive statement. Available in warm Vintage Gold or cool Platinum, these sterling silver earrings bring a polished romantic accent to everyday styling.\n\nColours: Vintage Gold / Platinum\nNote: Platinum is available by pre-order only.','S925 Sterling Silver / Cubic Zirconia',NULL,'Approx. 1 cm',120.00,0.00,'active',0,'2026-10-13 14:30:59','2026-10-16 20:27:07');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;

--
-- Table structure for table `promotions`
--

DROP TABLE IF EXISTS `promotions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `name` varchar(150) NOT NULL,
  `discount_type` enum('percentage','fixed') NOT NULL,
  `discount_value` decimal(12,2) NOT NULL,
  `minimum_spend` decimal(12,2) NOT NULL DEFAULT 0.00,
  `usage_limit` int(10) unsigned DEFAULT NULL,
  `usage_count` int(10) unsigned NOT NULL DEFAULT 0,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `apply_automatically` tinyint(1) NOT NULL DEFAULT 0,
  `first_order_only` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  CONSTRAINT `chk_promotion_value` CHECK (`discount_value` >= 0),
  CONSTRAINT `chk_promotion_period` CHECK (`ends_at` > `starts_at`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotions`
--

/*!40000 ALTER TABLE `promotions` DISABLE KEYS */;
/*!40000 ALTER TABLE `promotions` ENABLE KEYS */;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` bigint(20) unsigned NOT NULL,
  `user_id` bigint(20) unsigned NOT NULL,
  `order_item_id` bigint(20) unsigned DEFAULT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `title` varchar(150) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_reviews_user` (`user_id`),
  KEY `fk_reviews_order_item` (`order_item_id`),
  KEY `idx_reviews_product_status` (`product_id`,`status`),
  CONSTRAINT `fk_reviews_order_item` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_reviews_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chk_review_rating` CHECK (`rating` between 1 and 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;

--
-- Table structure for table `site_content`
--

DROP TABLE IF EXISTS `site_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `site_content` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `page_key` varchar(40) NOT NULL,
  `draft_content` longtext DEFAULT NULL,
  `published_content` longtext DEFAULT NULL,
  `published_at` datetime DEFAULT NULL,
  `updated_by` bigint(20) unsigned DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `page_key` (`page_key`),
  KEY `fk_site_content_user` (`updated_by`),
  CONSTRAINT `fk_site_content_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `site_content`
--

/*!40000 ALTER TABLE `site_content` DISABLE KEYS */;
INSERT INTO `site_content` VALUES (1,'home','{\"hero\":[{\"eyebrow\":\"CHRISÉA / COLLECTION 01\",\"title\":\"An Expression of Elegance.\",\"description\":\"Discover the beauty in every detail.\",\"buttonLabel\":\"Explore Collection\",\"buttonHref\":\"#new\",\"image\":\"http://localhost:5000/uploads/products/1792071178656-9abe3387-2b98-49fa-81d8-a619fb360e69.png\"},{\"eyebrow\":\"CHRISÉA / COLLECTION 02\",\"title\":\"Timeless Beauty, Modern You.\",\"description\":\"Jewelry for every chapter.\",\"buttonLabel\":\"Shop Collection\",\"buttonHref\":\"#new\",\"image\":\"/assets/hero/chrisea-jewelry-ring-hero.png\"},{\"eyebrow\":\"CHRISÉA / COLLECTION 03\",\"title\":\"A Gift That Lasts.\",\"description\":\"Celebrate every meaningful moment.\",\"buttonLabel\":\"Discover More\",\"buttonHref\":\"#promotion\",\"image\":\"/assets/hero/chrisea-jewelry-bracelet-hero.png\"}],\"arrivals\":{\"eyebrow\":\"New\",\"title\":\"New arrivals\",\"description\":\"Curated pieces for modern romantics.\",\"buttonLabel\":\"View all\",\"productIds\":[\"13\",\"12\",\"11\",\"8\"]},\"categories\":[{\"name\":\"Necklaces\",\"image\":\"/assets/products/enamel-coin-necklace/01-main.png\"},{\"name\":\"Bracelets\",\"image\":\"/assets/products/pearl-turquoise-bracelet/01-main.png\"},{\"name\":\"Rings\",\"image\":\"/assets/products/four-leaf-zircon-ring/03-main.png\"},{\"name\":\"Earrings\",\"image\":\"/assets/products/mother-of-pearl-heart-earrings/01-vintage-gold.png\"}],\"editorial\":{\"eyebrow\":\"The CHRISÉA Edit\",\"title\":\"Styled by You.\",\"subtitle\":\"Everyday Elegance\",\"description\":\"Timeless pieces, effortless looks. See how our jewelry brings a touch of elegance to your everyday moments.\",\"productIds\":[\"8\",\"7\",\"6\"]},\"story\":{\"eyebrow\":\"Our story\",\"title\":\"More than jewellery\",\"description\":\"CHRISÉA celebrates modern romance through vintage-inspired details, luminous pearls and meaningful motifs.\",\"buttonLabel\":\"Discover our story\",\"mainImage\":\"/assets/products/pearl-turquoise-bracelet/03-lifestyle.png\",\"detailImage\":\"/assets/products/minimalist-pearl-bracelet/03-lifestyle.png\"},\"promise\":{\"eyebrow\":\"The CHRISÉA promise\",\"title\":\"Made to be treasured\",\"items\":[{\"title\":\"Thoughtful details\",\"text\":\"Vintage-inspired forms, meaningful motifs and a refined finish.\"},{\"title\":\"Gift-ready\",\"text\":\"Every order is prepared to make the unboxing feel special.\"},{\"title\":\"Malaysia delivery\",\"text\":\"Carefully packed for delivery across our supported locations.\"},{\"title\":\"Personal service\",\"text\":\"Order and payment confirmation handled directly via WhatsApp.\"}]}}','{\"hero\":[{\"eyebrow\":\"CHRISÉA / COLLECTION 01\",\"title\":\"An Expression of Elegance.\",\"description\":\"Discover the beauty in every detail.\",\"buttonLabel\":\"Explore Collection\",\"buttonHref\":\"#new\",\"image\":\"http://localhost:5000/uploads/products/1792071178656-9abe3387-2b98-49fa-81d8-a619fb360e69.png\"},{\"eyebrow\":\"CHRISÉA / COLLECTION 02\",\"title\":\"Timeless Beauty, Modern You.\",\"description\":\"Jewelry for every chapter.\",\"buttonLabel\":\"Shop Collection\",\"buttonHref\":\"#new\",\"image\":\"/assets/hero/chrisea-jewelry-ring-hero.png\"},{\"eyebrow\":\"CHRISÉA / COLLECTION 03\",\"title\":\"A Gift That Lasts.\",\"description\":\"Celebrate every meaningful moment.\",\"buttonLabel\":\"Discover More\",\"buttonHref\":\"#promotion\",\"image\":\"/assets/hero/chrisea-jewelry-bracelet-hero.png\"}],\"arrivals\":{\"eyebrow\":\"New\",\"title\":\"New arrivals\",\"description\":\"Curated pieces for modern romantics.\",\"buttonLabel\":\"View all\",\"productIds\":[\"13\",\"12\",\"11\",\"8\"]},\"categories\":[{\"name\":\"Necklaces\",\"image\":\"/assets/products/enamel-coin-necklace/01-main.png\"},{\"name\":\"Bracelets\",\"image\":\"/assets/products/pearl-turquoise-bracelet/01-main.png\"},{\"name\":\"Rings\",\"image\":\"/assets/products/four-leaf-zircon-ring/03-main.png\"},{\"name\":\"Earrings\",\"image\":\"/assets/products/mother-of-pearl-heart-earrings/01-vintage-gold.png\"}],\"editorial\":{\"eyebrow\":\"The CHRISÉA Edit\",\"title\":\"Styled by You.\",\"subtitle\":\"Everyday Elegance\",\"description\":\"Timeless pieces, effortless looks. See how our jewelry brings a touch of elegance to your everyday moments.\",\"productIds\":[\"8\",\"7\",\"6\"]},\"story\":{\"eyebrow\":\"Our story\",\"title\":\"More than jewellery\",\"description\":\"CHRISÉA celebrates modern romance through vintage-inspired details, luminous pearls and meaningful motifs.\",\"buttonLabel\":\"Discover our story\",\"mainImage\":\"/assets/products/pearl-turquoise-bracelet/03-lifestyle.png\",\"detailImage\":\"/assets/products/minimalist-pearl-bracelet/03-lifestyle.png\"},\"promise\":{\"eyebrow\":\"The CHRISÉA promise\",\"title\":\"Made to be treasured\",\"items\":[{\"title\":\"Thoughtful details\",\"text\":\"Vintage-inspired forms, meaningful motifs and a refined finish.\"},{\"title\":\"Gift-ready\",\"text\":\"Every order is prepared to make the unboxing feel special.\"},{\"title\":\"Malaysia delivery\",\"text\":\"Carefully packed for delivery across our supported locations.\"},{\"title\":\"Personal service\",\"text\":\"Order and payment confirmation handled directly via WhatsApp.\"}]}}','2026-10-16 12:27:57',2,'2026-10-15 21:30:35','2026-10-16 12:27:57'),(7,'about','{\"hero\":{\"eyebrow\":\"The story of CHRISÉA\",\"title\":\"Jewellery for the chapters you’ll always remember.\",\"intro\":\"Born from a love of keepsakes, CHRISÉA brings vintage romance into the everyday.\",\"image\":\"/assets/about/about-hero.jpg\"},\"story\":{\"eyebrow\":\"Our beginning\",\"title\":\"A little nostalgia, made for now.\",\"paragraph\":\"CHRISÉA began with a simple belief: the jewellery we reach for most should feel as meaningful as the moments it becomes part of.\",\"signature\":\"For every chapter, with love.\",\"mainImage\":\"/assets/about/about-origin-main.jpg\",\"detailImage\":\"/assets/about/about-origin-detail.jpg\"},\"valuesEyebrow\":\"What guides us\",\"valuesTitle\":\"Beauty with meaning\",\"values\":[{\"number\":\"01\",\"title\":\"Thoughtfully chosen\",\"text\":\"Every detail is considered for its character, wearability and ability to feel personal.\"},{\"number\":\"02\",\"title\":\"Made for real life\",\"text\":\"Elegant pieces designed to move easily from everyday rituals to life’s milestones.\"},{\"number\":\"03\",\"title\":\"Beautifully presented\",\"text\":\"From the piece to the packaging, every order is prepared to feel like a gift.\"}],\"quote\":\"The best jewellery does not simply complete a look. It keeps a feeling close.\",\"journey\":{\"eyebrow\":\"Our journey\",\"title\":\"A story still unfolding\",\"items\":[{\"year\":\"2026\",\"title\":\"CHRISÉA begins\",\"text\":\"A curated jewellery house for modern romantics is born in Malaysia.\"},{\"year\":\"Today\",\"title\":\"Chosen with intention\",\"text\":\"We continue to discover pieces that balance sentiment, beauty and everyday ease.\"},{\"year\":\"Always\",\"title\":\"Made part of your story\",\"text\":\"Our favourite chapter is the one each piece begins with you.\"}]},\"cta\":{\"eyebrow\":\"Find your keepsake\",\"title\":\"Wear the moment. Keep the memory.\",\"buttonLabel\":\"Explore the collection\",\"buttonHref\":\"/shop\",\"image\":\"http://localhost:5000/uploads/products/1792073091663-c1fcdd6b-abd4-4a6e-9fa1-2b9d9e9b70ff.png\"}}','{\"hero\":{\"eyebrow\":\"The story of CHRISÉA\",\"title\":\"Jewellery for the chapters you’ll always remember.\",\"intro\":\"Born from a love of keepsakes, CHRISÉA brings vintage romance into the everyday.\",\"image\":\"/assets/about/about-hero.jpg\"},\"story\":{\"eyebrow\":\"Our beginning\",\"title\":\"A little nostalgia, made for now.\",\"paragraph\":\"CHRISÉA began with a simple belief: the jewellery we reach for most should feel as meaningful as the moments it becomes part of.\",\"signature\":\"For every chapter, with love.\",\"mainImage\":\"/assets/about/about-origin-main.jpg\",\"detailImage\":\"/assets/about/about-origin-detail.jpg\"},\"valuesEyebrow\":\"What guides us\",\"valuesTitle\":\"Beauty with meaning\",\"values\":[{\"number\":\"01\",\"title\":\"Thoughtfully chosen\",\"text\":\"Every detail is considered for its character, wearability and ability to feel personal.\"},{\"number\":\"02\",\"title\":\"Made for real life\",\"text\":\"Elegant pieces designed to move easily from everyday rituals to life’s milestones.\"},{\"number\":\"03\",\"title\":\"Beautifully presented\",\"text\":\"From the piece to the packaging, every order is prepared to feel like a gift.\"}],\"quote\":\"The best jewellery does not simply complete a look. It keeps a feeling close.\",\"journey\":{\"eyebrow\":\"Our journey\",\"title\":\"A story still unfolding\",\"items\":[{\"year\":\"2026\",\"title\":\"CHRISÉA begins\",\"text\":\"A curated jewellery house for modern romantics is born in Malaysia.\"},{\"year\":\"Today\",\"title\":\"Chosen with intention\",\"text\":\"We continue to discover pieces that balance sentiment, beauty and everyday ease.\"},{\"year\":\"Always\",\"title\":\"Made part of your story\",\"text\":\"Our favourite chapter is the one each piece begins with you.\"}]},\"cta\":{\"eyebrow\":\"Find your keepsake\",\"title\":\"Wear the moment. Keep the memory.\",\"buttonLabel\":\"Explore the collection\",\"buttonHref\":\"/shop\",\"image\":\"http://localhost:5000/uploads/products/1792073091663-c1fcdd6b-abd4-4a6e-9fa1-2b9d9e9b70ff.png\"}}','2026-10-16 12:28:25',2,'2026-10-15 22:04:55','2026-10-16 12:28:25'),(11,'announcement','{\"messages\":[\"Complimentary shipping on orders over RM200\",\"Gift-ready packaging\"]}','{\"messages\":[\"Complimentary shipping on orders over RM200\",\"Gift-ready packaging\"]}','2026-10-16 12:34:02',2,'2026-10-15 22:17:08','2026-10-16 12:34:02'),(13,'footer','{\"brandText\":\"Timeless pieces for modern romantics. Designed to celebrate every chapter.\",\"socialLabel\":\"Follow our journey\",\"shopTitle\":\"Shop\",\"careTitle\":\"Customer care\",\"newsletterTitle\":\"Join our journey\",\"newsletterText\":\"Be the first to know about new arrivals, exclusive offers and more.\",\"copyright\":\"© 2026 CHRISÉA Jewelry. All rights reserved.\",\"legalText\":\"Privacy Policy | Terms & Conditions\",\"care\":{\"faq\":{\"eyebrow\":\"Customer care\",\"title\":\"Frequently Asked Questions\",\"intro\":\"A few helpful answers about ordering from CHRISÉA.\",\"sections\":[[\"Can I change my order?\",\"Please contact us as soon as possible. We will gladly help before your order has been prepared for dispatch.\"],[\"How should I care for my jewellery?\",\"Keep each piece dry, avoid perfume and lotions, and store it separately in its pouch after wearing.\"],[\"Is gift packaging available?\",\"Every CHRISÉA order is thoughtfully presented and ready for gifting.\"]]},\"shipping\":{\"eyebrow\":\"Delivery information\",\"title\":\"Shipping & Delivery\",\"intro\":\"Your jewellery is carefully prepared and packed before beginning its journey to you.\",\"sections\":[[\"Malaysia delivery\",\"Orders are usually prepared within 1–2 business days. Delivery typically takes 2–5 business days after dispatch.\"],[\"Shipping updates\",\"Once your parcel is on the way, delivery details will be sent to the email address used at checkout.\"],[\"Packaging\",\"Each order is protected in signature CHRISÉA packaging suitable for keeping or gifting.\"],[\"11\",\"11\"]]},\"returns\":{\"eyebrow\":\"Customer care\",\"title\":\"Return & Refund\",\"intro\":\"We want every CHRISÉA piece to feel just right when it arrives.\",\"sections\":[[\"Return window\",\"Eligible unworn items may be requested for return within 14 days of delivery, with original packaging included.\"],[\"Making a request\",\"Contact our customer care team with your order details and reason for return before sending an item back.\"],[\"Refunds\",\"Approved refunds are returned to the original payment method after the item has been received and inspected.\"]]},\"contact\":{\"eyebrow\":\"We are here to help\",\"title\":\"Contact CHRISÉA\",\"intro\":\"Questions about a piece, an order or a gift? Our customer care team would be delighted to help.\",\"sections\":[[\"Email\",\"hello@chrisea.com\"],[\"WhatsApp concierge\",\"Available Monday to Saturday, 10:00 AM–6:00 PM MYT.\"],[\"Our boutique\",\"CHRISÉA is an online jewellery house based in Malaysia.\"]]}}}','{\"brandText\":\"Timeless pieces for modern romantics. Designed to celebrate every chapter.\",\"socialLabel\":\"Follow our journey\",\"shopTitle\":\"Shop\",\"careTitle\":\"Customer care\",\"newsletterTitle\":\"Join our journey\",\"newsletterText\":\"Be the first to know about new arrivals, exclusive offers and more.\",\"copyright\":\"© 2026 CHRISÉA Jewelry. All rights reserved.\",\"legalText\":\"Privacy Policy | Terms & Conditions\",\"care\":{\"faq\":{\"eyebrow\":\"Customer care\",\"title\":\"Frequently Asked Questions\",\"intro\":\"A few helpful answers about ordering from CHRISÉA.\",\"sections\":[[\"Can I change my order?\",\"Please contact us as soon as possible. We will gladly help before your order has been prepared for dispatch.\"],[\"How should I care for my jewellery?\",\"Keep each piece dry, avoid perfume and lotions, and store it separately in its pouch after wearing.\"],[\"Is gift packaging available?\",\"Every CHRISÉA order is thoughtfully presented and ready for gifting.\"]]},\"shipping\":{\"eyebrow\":\"Delivery information\",\"title\":\"Shipping & Delivery\",\"intro\":\"Your jewellery is carefully prepared and packed before beginning its journey to you.\",\"sections\":[[\"Malaysia delivery\",\"Orders are usually prepared within 1–2 business days. Delivery typically takes 2–5 business days after dispatch.\"],[\"Shipping updates\",\"Once your parcel is on the way, delivery details will be sent to the email address used at checkout.\"],[\"Packaging\",\"Each order is protected in signature CHRISÉA packaging suitable for keeping or gifting.\"],[\"11\",\"11\"]]},\"returns\":{\"eyebrow\":\"Customer care\",\"title\":\"Return & Refund\",\"intro\":\"We want every CHRISÉA piece to feel just right when it arrives.\",\"sections\":[[\"Return window\",\"Eligible unworn items may be requested for return within 14 days of delivery, with original packaging included.\"],[\"Making a request\",\"Contact our customer care team with your order details and reason for return before sending an item back.\"],[\"Refunds\",\"Approved refunds are returned to the original payment method after the item has been received and inspected.\"]]},\"contact\":{\"eyebrow\":\"We are here to help\",\"title\":\"Contact CHRISÉA\",\"intro\":\"Questions about a piece, an order or a gift? Our customer care team would be delighted to help.\",\"sections\":[[\"Email\",\"hello@chrisea.com\"],[\"WhatsApp concierge\",\"Available Monday to Saturday, 10:00 AM–6:00 PM MYT.\"],[\"Our boutique\",\"CHRISÉA is an online jewellery house based in Malaysia.\"]]}}}','2026-10-16 12:29:09',2,'2026-10-15 23:38:39','2026-10-16 12:29:09'),(22,'shop','{\"promotion\":[{\"eyebrow\":\"The signature edit\",\"title\":\"A little something, just for you.\",\"description\":\"Discover handpicked pieces made for gifting, keeping and every meaningful moment between.\",\"buttonLabel\":\"Shop the edit\",\"image\":\"https://images.unsplash.com/photo-1578632297758-3a6c6de14be8?auto=format&fit=crop&w=2400&q=85\"},{\"eyebrow\":\"New arrivals\",\"title\":\"Made for your next chapter.\",\"description\":\"Meet the latest jewellery chosen to bring a little beauty to every day.\",\"buttonLabel\":\"Discover new pieces\",\"image\":\"/assets/hero/chrisea-jewelry-ring-hero.png\"},{\"eyebrow\":\"The gift edit\",\"title\":\"A meaningful gift, beautifully chosen.\",\"description\":\"Find keepsakes for celebrations, milestones and the moments in between.\",\"buttonLabel\":\"Explore gifts\",\"image\":\"/assets/hero/chrisea-jewelry-bracelet-hero.png\"}],\"favourites\":{\"title\":\"Our Favourites\",\"description\":\"Four pieces selected especially for you.\",\"productIds\":[\"13\",\"12\",\"11\",\"9\"]},\"catalogue\":{\"eyebrow\":\"Shop by category\",\"title\":\"Find your signature piece\",\"productOrders\":{\"All\":[\"10\",\"11\",\"13\",\"12\",\"9\",\"8\",\"7\",\"6\",\"5\",\"4\",\"3\",\"2\",\"1\"],\"Necklaces\":[\"2\",\"1\"],\"Bracelets\":[\"3\",\"5\",\"4\"],\"Rings\":[\"9\",\"8\",\"7\",\"6\"],\"Earrings\":[\"13\",\"12\",\"11\",\"10\"]}}}','{\"promotion\":[{\"eyebrow\":\"The signature edit\",\"title\":\"A little something, just for you.\",\"description\":\"Discover handpicked pieces made for gifting, keeping and every meaningful moment between.\",\"buttonLabel\":\"Shop the edit\",\"image\":\"https://images.unsplash.com/photo-1578632297758-3a6c6de14be8?auto=format&fit=crop&w=2400&q=85\"},{\"eyebrow\":\"New arrivals\",\"title\":\"Made for your next chapter.\",\"description\":\"Meet the latest jewellery chosen to bring a little beauty to every day.\",\"buttonLabel\":\"Discover new pieces\",\"image\":\"/assets/hero/chrisea-jewelry-ring-hero.png\"},{\"eyebrow\":\"The gift edit\",\"title\":\"A meaningful gift, beautifully chosen.\",\"description\":\"Find keepsakes for celebrations, milestones and the moments in between.\",\"buttonLabel\":\"Explore gifts\",\"image\":\"/assets/hero/chrisea-jewelry-bracelet-hero.png\"}],\"favourites\":{\"title\":\"Our Favourites\",\"description\":\"Four pieces selected especially for you.\",\"productIds\":[\"13\",\"12\",\"11\",\"9\"]},\"catalogue\":{\"eyebrow\":\"Shop by category\",\"title\":\"Find your signature piece\",\"productOrders\":{\"All\":[\"10\",\"11\",\"13\",\"12\",\"9\",\"8\",\"7\",\"6\",\"5\",\"4\",\"3\",\"2\",\"1\"],\"Necklaces\":[\"2\",\"1\"],\"Bracelets\":[\"3\",\"5\",\"4\"],\"Rings\":[\"9\",\"8\",\"7\",\"6\"],\"Earrings\":[\"13\",\"12\",\"11\",\"10\"]}}}','2026-10-16 12:50:22',2,'2026-10-16 12:44:29','2026-10-16 12:50:22');
/*!40000 ALTER TABLE `site_content` ENABLE KEYS */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `role` enum('customer','admin') NOT NULL DEFAULT 'customer',
  `status` enum('active','disabled') NOT NULL DEFAULT 'active',
  `email_verified_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'test@chrisea.com','$2b$12$6KD5BpHwWH9PX.mL3miAS.MQAdXrlXhC0l9BHCdiqjqQODkRU858u','Test Customer','0123456789','customer','active',NULL,'2026-10-13 14:42:00','2026-10-13 14:42:00'),(2,'admin@chrisea.local','$2b$12$8O2cHawS4746lcNbdnqyQuy9RjsuIybYkfGjwFqjrmE34.n.VcTmO','CHRISÉA Administrator',NULL,'admin','active',NULL,'2026-10-13 14:47:39','2026-10-13 14:47:39'),(3,'mone2854@gmail.com','$2b$12$lcvZ8EFpxUvcqxTwrwy0Zu/PIzIUreih64k0oAF1XcwtoYJ6kD3wa','lui','01911111','customer','active',NULL,'2026-10-14 07:49:54','2026-10-14 20:08:04');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

--
-- Table structure for table `wishlists`
--

DROP TABLE IF EXISTS `wishlists`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `wishlists` (
  `user_id` bigint(20) unsigned NOT NULL,
  `product_id` bigint(20) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`,`product_id`),
  KEY `fk_wishlist_product` (`product_id`),
  CONSTRAINT `fk_wishlist_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_wishlist_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlists`
--

/*!40000 ALTER TABLE `wishlists` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlists` ENABLE KEYS */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-17  0:14:21
