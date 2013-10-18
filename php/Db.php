<?php
	class Db extends stdClass {
		private $conn;

		function __construct() {
			$this->conn = mysql_connect('localhost', 'root', '6N911xoz881');
			mysql_select_db('library', $this->conn);
		}

		public function executeSql($sql, $type) {
			//echo($sql . '; ');
			if($result = mysql_query($sql)) {
				if($type === 'insert') {
					return mysql_insert_id();
				} elseif($type === 'update' || $type === 'delete') {
					return 'Success';
				} else {
					$array = array();
					while($row = mysql_fetch_assoc($result)) {
						//print_r($row);
						$array[] = $row;
					}
					return $array;
				}
			} else {
				die('Query error: ' . mysql_error());
			}
		}
	}
?>