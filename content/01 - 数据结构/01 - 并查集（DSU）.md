# 并查集（DSU）

先 `DSU(n)`，随后用 `merge(u,v)` 合并，用 `same(u,v)`、`size(u)` 查询；新数据先 `init(n)`。

点编号为 `0..n-1`，`n >= 0`；输入从 1 编号时可开 `n+1`。只能合并，不能拆分或撤销；每组新数据用 `init(n)` 重置。

合并、查询均摊 `O(α(n))`；初始化和空间均为 `O(n)`。

```cpp
struct DSU {
    // f[u] 是并查集父节点，不一定是代表；siz 只有在代表处有效，读 siz[find(u)]
    std::vector<int> f, siz;

    // 空对象使用前先调用 init(n)
    DSU() {}
    DSU(int n) {
        init(n);
    }

    // 重置为 n 个独立集合
    void init(int n) {
        f.resize(n);
        std::iota(f.begin(), f.end(), 0);
        siz.assign(n, 1);
    }

    // 返回 x 所在集合的代表编号
    int find(int x) {
        while (x != f[x]) {
            x = f[x] = f[f[x]];
        }
        return x;
    }

    // 判断是否同组
    bool same(int x, int y) {
        return find(x) == find(y);
    }

    // 合并成功返回 true，原本同组返回 false
    bool merge(int x, int y) {
        x = find(x);
        y = find(y);
        if (x == y) {
            return false;
        }
        if (siz[x] < siz[y]) {
            std::swap(x, y);
        }
        siz[x] += siz[y];
        f[y] = x;
        return true;
    }

    // 返回所在组的元素数
    int size(int x) {
        return siz[find(x)];
    }
};
```

## 连通块统计（扩展）

依赖上方的 DSU。

只支持加边，不支持删除；每条输入边添加一次，允许重边和自环。自环仅指自己连自己的边，不是判断一般环。

```cpp
class GraphComponentDSU {
    DSU dsu;
    vector<i64> edgeCount;
    vector<bool> loop;

  public:
    explicit GraphComponentDSU(int n) : dsu(n), edgeCount(n), loop(n) {
        assert(n >= 0);
    }

    // 加无向边；合并了不同连通块时返回 true
    bool addEdge(int u, int v) {
        int a = dsu.find(u), b = dsu.find(v);
        i64 count = edgeCount[a] + 1;
        bool self = loop[a] || u == v;
        if (a != b)
            count += edgeCount[b], self = self || loop[b];

        bool merged = dsu.merge(a, b);
        int root = dsu.find(a);
        edgeCount[root] = count;
        loop[root] = self;
        return merged;
    }

    // 返回所在连通块的点数
    int vertices(int u) {
        return dsu.size(u);
    }

    // 返回边数，重边和自环照计
    i64 edges(int u) {
        return edgeCount[dsu.find(u)];
    }

    // 是否有自己连自己的边
    bool hasSelfLoop(int u) {
        return loop[dsu.find(u)];
    }
};
```
