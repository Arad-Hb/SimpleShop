$connStr = 'Server=.;Database=SimpleShopLayeredDb;Trusted_Connection=True;TrustServerCertificate=True;'
$conn = New-Object System.Data.SqlClient.SqlConnection($connStr)
$conn.Open()
$cmd = $conn.CreateCommand()
$cmd.CommandText = 'SELECT TOP 1 Id, Name FROM Categories ORDER BY Id'
$adapter = New-Object System.Data.SqlClient.SqlDataAdapter $cmd
$table = New-Object System.Data.DataTable
[void]$adapter.Fill($table)
$cols = ($table.Columns | ForEach-Object { $_.ColumnName }) -join ', '
Write-Host "Columns: $cols"
$r = $table.Rows[0]
Write-Host "Id: $($r['Id']) Name: $($r['Name'])"
$conn.Close()
