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

		public function getData($table, $filters, $sort) {
			if($table === 'movies') {
				$select = 'x.movId, x.title, x.alphabeticaltitle, x.location, x.seen, x.rating, x.discs, g.genId';
				$from = 'movies x LEFT JOIN entry_genre eg ON x.movId = eg.movId LEFT JOIN genres g ON eg.genId = g.genId';
			} elseif($table === 'games') {
				$select = 'x.gamId, x.title, x.alphabeticaltitle, x.location, x.beaten, x.rating, x.discs, g.genId, s.systemname';
				$from = 'games x LEFT JOIN entry_genre eg ON x.gamId = eg.gamId LEFT JOIN genres g ON eg.genId = g.genId LEFT JOIN systems s ON x.sysId = s.sysId';
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

			$results = $this->selectDistinct($from, $where, $order, $select);
			//print_r($results);
			
			if(count($results)) {
				$lastId = 0;
				$genIds = array();
				$data = array();
				$count = 0;
				foreach($results as $key => $result) {
					$thisId = $result[($table === 'movies' ? 'movId' : 'gamId')];
					if($thisId === $lastId) {
						$genIds[] = $result['genId'];
						//print_r($genIds);
					} else {
						if($count > 0) {
							if(count($genIds) > 0) {
								$results[$key-1]['genIds'] = $genIds;
							}
							unset($results[$key-1]['genId']);
							unset($results[$key-1]['entGenId']);
							$data[] = $results[$key-1];
						}
						$genIds = array();
						if($result['genId']) {
							$genIds[] = $result['genId'];
						}
					}
					$lastId = $thisId;
					$count++;
				}
				if(count($genIds) > 0) {
					$results[$key]['genIds'] = $genIds;
				}
				unset($results[$key]['genId']);
				unset($results[$key]['entGenId']);
				$data[] = $results[$key];
				return $data;
			} else {
				return $results;
			}
		}

		public function getGenres($type) {
			$from = 'genres';
			$where = 'type = "' . mysql_real_escape_string($type) . '"';
			$order = 'genrename ASC';
			return $this->selectDistinct($from, $where, $order, '');
		}

		public function getSystems() {
			$from = 'systems';
			$where = null;
			$order = 'systemname ASC';
			return $this->selectDistinct($from, $where, $order, '');
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
			return $this->selectDistinct($from, $where, $order);
		}

		private function selectDistinct($from, $where, $order, $select) {
			$sql = 'SELECT DISTINCT ' . ($select ? $select : '*');
			$sql .= ' FROM ' . $from;
			if(!empty($where)) {
				$sql .= ' WHERE ' . $where;
			}
			if(!empty($order)) {
				$sql .= ' ORDER BY ' . $order;
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
		case 'getData':
			$response = $api->getData($data['table'], $data['filters'], $data['sort']);
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
		case 'addData':
			$response = $api->addData($data['table'], $data['data']);
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