--
-- MySQL 5.5.5
-- Sun, 24 May 2020 09:02:26 +0000
--

CREATE TABLE `log` (
   `timestamp` timestamp not null default 'current_timestamp()' on update current_timestamp(),
   `id` int(11) not null auto_increment,
   `table` varchar(10),
   `menu` varchar(10000),
   `price` int(11),
   `staff` varchar(10),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;


CREATE TABLE `queue` (
   `timestamp` timestamp not null default 'current_timestamp()' on update current_timestamp(),
   `id` int(11) not null auto_increment,
   `table` varchar(10),
   `menu` varchar(10000),
   PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1;


CREATE TABLE `table_status` (
   `table` varchar(10) not null,
   `status` varchar(30),
   `price` int(11),
   `menu` varchar(10000),
   PRIMARY KEY (`table`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;