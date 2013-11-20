<?php

	class Api extends stdClass {
		private $db;

		function __construct() {
			include 'Db.php';
			$this->db = new Db();
		}

		public function addData($table, $data) {
			if($data = json_decode($data)) {
				foreach($data as $key => $value) {
					if($value->column === 'genre') {
						$genre = $value;
						unset($data[$key]);
						break;
					}
				}

				$id = $this->insert($table, $data);

				// Add links
				if($genre) {
					foreach($genre->value as $genId) {
						$data = array();
						$row = new stdClass();
						$row2 = new stdClass();
						$row->column = 'genId';
						$row->value = $genId;
						$data[] = $row;
						if($table === 'movies') {
							$row2->column = 'movId';
						} else {
							$row2->column = 'gamId';
						}
						$row2->value = $id;
						$data[] = $row2;

						$this->insert('entry_genre', $data);
					}
				}

				return $id;

			}
		}

		public function averageBeforeDate($date) {
			$select = 'AVG(rating) rating';
			$from = 'movies';
			//$where = 'date > "2004-01-01" and date < "' . $date . '" AND rating > 0';
			$where = 'date < "' . $date . '" AND rating > 0';
			return $this->selectDistinct($select, $from, $where, null, null, null);
		}

		private function delete($from, $where) {
			$sql = 'DELETE FROM ' . $from;
			$sql .= ' WHERE ' . $where;
			$this->db->executeSql($sql, 'delete');
		}

		private function deleteLinks($table, $where) {
			$from = $table;
			$where = $where->column . ' = "' . $where->value . '"';
			return $this->delete($from, $where);
		}

		public function getCounts($table) {
			$select = 'rating x, count(*) y';
			$from = mysql_real_escape_string($table);
			$where = 'rating > 0';
			$group = 'rating';
			$order = 'rating ASC';
			return $this->selectDistinct($select, $from, $where, $group, $order, null);
		}

		public function getData($table, $filters, $sort, $limit) {
			if($table === 'movies') {
				$select = 'x.movId, x.title, x.alphabeticaltitle, x.location, x.seen, x.rating, x.discs, GROUP_CONCAT(g.genId ORDER BY g.genrename) genIds';
				$from = 'movies x LEFT JOIN entry_genre eg ON x.movId = eg.movId LEFT JOIN genres g ON eg.genId = g.genId';
				$group = 'x.movId';
			} elseif($table === 'games') {
				$select = 'x.gamId, x.title, x.alphabeticaltitle, x.location, x.beaten, x.rating, x.discs, GROUP_CONCAT(g.genId ORDER BY genrename) genIds, s.sysId, s.systemname';
				$from = 'games x LEFT JOIN entry_genre eg ON x.gamId = eg.gamId LEFT JOIN genres g ON eg.genId = g.genId LEFT JOIN systems s ON x.sysId = s.sysId';
				$group = 'x.gamId';
			}
		
			$where = '';
			if(!empty($filters)) {
				if($filters = json_decode($filters)) {
					$count = 0;
					foreach($filters as $filter) {
						$where .= ($count ? ' AND ' : '') . mysql_real_escape_string($filter->column);
						if($filter->condition === 'not') {
							$where .= ' NOT LIKE "%' . mysql_real_escape_string($filter->value) . '%"';
						} else if($filter->condition === 'equals') {
							$where .= ' = "' . mysql_real_escape_string($filter->value) . '"';
						} else {
							$where .= ' LIKE "%' . mysql_real_escape_string($filter->value) . '%"';
						}
						$count++;
					}
				}
			}

			$order = '';
			if(!empty($sort)) {
				if($sort = json_decode($sort)) {
					$count = 0;
					foreach($sort as $sortby) {
						$order .= ($count ? ', ' : '') . mysql_real_escape_string($sortby->column) . ' ' . mysql_real_escape_string($sortby->order);
						$count++;
					}
				}
			}
			$order .= (strlen($order)>0 ? ', ' : '') . 'x.alphabeticaltitle ASC';

			// if(!empty($limit)) {
			// 	if($limit = json_decode($limit)) {
			// 		$limit = mysql_real_escape_string($limit->start) . ', 500';
			// 	}
			// }
			$limit = null;

			return $this->selectDistinct($select, $from, $where, $group, $order, $limit);
		}

		public function getGenres($type) {
			$from = 'genres';
			$where = 'type = "' . mysql_real_escape_string($type) . '"';
			$order = 'genrename ASC';
			return $this->selectDistinct(null, $from, $where, null, $order, null);
		}

		public function getSystems() {
			$from = 'systems';
			$order = 'systemname ASC';
			return $this->selectDistinct(null, $from, null, null, $order, null);
		}

		public function insert($table, $data) {
			$sql = 'INSERT INTO ' . mysql_real_escape_string($table);
			$count = 0;
			$cols = '';
			$vals = '';
			foreach($data as $value) {
				$cols .= ($count ? ', ' : '') . mysql_real_escape_string($value->column);
				$vals .= ($count ? ', ' : '') . '"' . mysql_real_escape_string($value->value) . '"';
				$count++;
			}
			$sql .= '('.$cols.') VALUES ('.$vals.')';
			//echo($sql);
			$this->db->executeSql($sql, 'insert');
			return mysql_insert_id();
		}

		public function login($user, $pass) {
			$from = 'users';
			$where = 'username = "' . mysql_real_escape_string($user) . '"';
			$where .= ' AND password = "' . mysql_real_escape_string($pass) . '"';
			$order = null;
			return $this->selectDistinct(null, $from, $where, null, $order, null);
		}

		private function selectDistinct($select, $from, $where, $group, $order, $limit) {
			$sql = 'SELECT DISTINCT ' . ($select ? $select : '*');
			$sql .= ' FROM ' . $from;
			if(!empty($where)) {
				$sql .= ' WHERE ' . $where;
			}
			if(!empty($group)) {
				$sql .= ' GROUP BY ' . $group;
			}
			if(!empty($order)) {
				$sql .= ' ORDER BY ' . $order;
			}
			if(!empty($limit)) {
				$sql .= ' LIMIT ' . $limit;
			}
			return $this->db->executeSql($sql, 'select');
		}

		private function update($from, $where, $set) {
			$sql = 'UPDATE ' . $from;
			$sql .= ' SET ' . $set;
			$sql .= ' WHERE ' . $where;
			// echo($sql);
			return $this->db->executeSql($sql, 'update');
		}

		public function updateData($table, $where, $data) {
			$from = $table;
			if($where = json_decode($where)) {
				$where2 = mysql_real_escape_string($where->column) . ' = "' . mysql_real_escape_string($where->value) . '"';
			}
			$set = '';
			if($data = json_decode($data)) {
				$count = 0;
				foreach($data as $value) {
					if($value->column !== 'genre') {
						$set .= ($count ? ', ' : '') . mysql_real_escape_string($value->column) . ' = "' . mysql_real_escape_string($value->value) . '"';
						$count++;
					} else {
						$genre = $value;
					}
				}
			}
			$this->update($from, $where2, $set);


			$this->deleteLinks('entry_genre', $where);

			// Add links
			if($genre) {
				foreach($genre->value as $genId) {
					$data = array();
					$row = new stdClass();
					$row2 = new stdClass();
					$row->column = 'genId';
					$row->value = $genId;
					$data[] = $row;
					if($table === 'movies') {
						$row2->column = 'movId';
					} else {
						$row2->column = 'gamId';
					}
					$row2->value = $where->value;
					$data[] = $row2;

					$this->insert('entry_genre', $data);
				}
			}
		}
	}

	$data = $_POST;
	$api = new Api();
	switch($data['command']) {
		case 'addData':
			$response = $api->addData($data['table'], $data['data']);
			break;
		case 'averageBeforeDate':
			$response = $api->averageBeforeDate($data['date']);
			break;
		case 'getCounts':
			$response = $api->getCounts($data['table']);
			break;
		case 'getData':
			$response = $api->getData($data['table'], $data['filters'], $data['sort'], $data['limit']);
			break;
		case 'getGenres':
			$response = $api->getGenres($data['type']);
			break;
		case 'getSystems':
			$response = $api->getSystems();
			break;
		case 'login':
			$response = $api->login($data['user'], $data['pass']);
			break;
		case 'updateData':
			$response = $api->updateData($data['table'], $data['where'], $data['data']);
			break;
		default:
			$response = 'Unrecognized command: ' . $data['command'];
			break;
	}

	die(json_encode($response));

?>