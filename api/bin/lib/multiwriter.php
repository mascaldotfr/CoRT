<?php

/*
 * MultiWriter writes data to a file and automatically creates compressed versions
 * (.gz, and .zst if available) alongside it.
 * Use write() for creating new files, append() for adding lines to existing ones.
 *
 * EXAMPLES:
 * require_once "MultiWriter.php";
 * MultiWriter::write("output.json", $json_data);
 * MultiWriter::append("../../var/trainer_saved_setups.txt", "some text\n");
 */

class MultiWriter
{
	// name: just the basename (like "data.json" or "myfile.txt"), we add .gz/.zst
	// data: the content to write
	public static function write(string $name, string $data): void
	{
		file_put_contents($name, $data);

		$gz = gzopen($name . ".gz", "w9");
		gzwrite($gz, $data);
		gzclose($gz);

		if (function_exists("zstd_compress")) {
			$zstd_data = zstd_compress($data, 19);
			file_put_contents($name . ".zst", $zstd_data);
		}
	}

	// path: where to add it
	// data: what you wanna add
	public static function append(string $path, string $data): void
	{
		file_put_contents($path, $data, FILE_APPEND | LOCK_EX);

		$gz = gzopen($path . ".gz", "a");
		gzwrite($gz, $data);
		gzclose($gz);

		if (function_exists("zstd_compress")) {
			$zstd_data = zstd_compress($data, 19);
			file_put_contents($path . ".zst", $zstd_data, FILE_APPEND | LOCK_EX);
		}
	}
}

?>
